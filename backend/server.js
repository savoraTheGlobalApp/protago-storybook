import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dns from 'dns/promises';
import Razorpay from 'razorpay';
import { Resend } from 'resend';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const disposableDomains = _require('disposable-email-domains');
import { triggerPreview } from './preview.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ── Resend email client ───────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.RESEND_FROM || 'Protago <hello@protago.in>';

// ── Meta Conversions API ──────────────────────────────────────────────────────
function sha256(value) {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  // Add India country code if 10-digit local number
  return digits.length === 10 ? `91${digits}` : digits;
}

async function sendMetaCAPIEvent({ eventName, email, phone, firstName, fbc, fbp, eventSourceUrl, customData = {} }) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  const userData = {};
  if (email)     userData.em = sha256(email);
  if (phone)     { const p = normalizePhone(phone); if (p) userData.ph = sha256(p); }
  if (firstName) userData.fn = sha256(firstName.split(' ')[0]);
  if (fbc)       userData.fbc = fbc;   // not hashed — passed as-is per Meta spec
  if (fbp)       userData.fbp = fbp;   // not hashed — passed as-is per Meta spec

  const payload = {
    data: [{
      event_name:        eventName,
      event_time:        Math.floor(Date.now() / 1000),
      action_source:     'website',
      event_source_url:  eventSourceUrl || 'https://protago.in',
      user_data:         userData,
      custom_data:       customData,
    }],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const json = await res.json();
    console.log(`Meta CAPI [${eventName}]:`, json.events_received ?? json.error ?? json);
  } catch (err) {
    console.error(`Meta CAPI [${eventName}] error:`, err.message);
  }
}

// ── Discord error alerting ────────────────────────────────────────────────────
async function alertDiscord(title, detail, { jobId, storySlug, email } = {}) {
  const url = process.env.ALERTS_DISCORD_URL;
  if (!url) return;
  const lines = [
    `🚨 **${title}**`,
    detail ? `> ${detail.slice(0, 500)}` : null,
    storySlug ? `📖 Theme: ${storySlug}` : null,
    email    ? `✉️ Email: ${email}` : null,
    jobId    ? `🆔 Job: ${jobId}` : null,
  ].filter(Boolean).join('\n');
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: lines }) })
    .catch(() => {});
}

// Alert on unhandled rejections / uncaught exceptions so Railway crashes show in Discord
process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.stack || reason.message : String(reason);
  alertDiscord('Unhandled Rejection', msg);
});
process.on('uncaughtException', (err) => {
  alertDiscord('Uncaught Exception', err.stack || err.message);
});

// ── Email validation helpers ──────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function validateEmail(email) {
  if (!email || !EMAIL_REGEX.test(email)) return { valid: false, reason: 'Invalid email format' };
  const domain = email.split('@')[1].toLowerCase();
  if (disposableDomains.includes(domain)) return { valid: false, reason: 'Disposable email addresses are not allowed' };
  try {
    const mx = await dns.resolveMx(domain);
    if (!mx || mx.length === 0) return { valid: false, reason: 'Email domain does not exist' };
  } catch {
    return { valid: false, reason: 'Email domain does not exist' };
  }
  return { valid: true };
}

// ── OTP token helpers (stateless HMAC — survives restarts & works across replicas) ──
// Token = base64url(payload) + "." + HMAC-SHA256(base64url(payload), secret)
// Payload: JSON { phone, exp } — expires 30 min after issuance.
// Any instance can verify any token as long as OTP_SIGNING_SECRET matches.
const OTP_SECRET = process.env.OTP_SIGNING_SECRET || 'dev_otp_signing_secret';

function issueOtpToken(phone) {
    const payload = Buffer.from(JSON.stringify({
        phone,
        exp: Date.now() + 30 * 60 * 1000,
    })).toString('base64url');
    const sig = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

function verifyOtpToken(token, phone) {
    try {
        const dot = token.lastIndexOf('.');
        if (dot < 0) return false;
        const payload = token.slice(0, dot);
        const sig = token.slice(dot + 1);
        const expected = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('base64url');
        if (sig !== expected) return false;
        const { phone: tPhone, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return tPhone === phone && Date.now() < exp;
    } catch {
        return false;
    }
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// helper to process image: strip metadata, cap dimensions, re-encode with high quality
// defined at module scope so it can be reused by multiple routes (create-order, upload-photo).
async function processImageBuffer(inputBuffer, inputMime) {
    // cap max dimension to 4000px for performance and to avoid huge uploads
    const transformer = sharp(inputBuffer).rotate().resize({ width: 4000, height: 4000, fit: 'inside' });

    let outBuffer;
    let outMime = inputMime;
    let ext = 'jpg';

    if (inputMime.includes('png')) {
        outBuffer = await transformer.png({ compressionLevel: 6 }).toBuffer();
        outMime = 'image/png';
        ext = 'png';
    } else if (inputMime.includes('webp')) {
        outBuffer = await transformer.webp({ quality: 90 }).toBuffer();
        outMime = 'image/webp';
        ext = 'webp';
    } else {
        // default to high-quality JPEG for photos
        outBuffer = await transformer.jpeg({ quality: 92 }).toBuffer();
        outMime = 'image/jpeg';
        ext = 'jpg';
    }

    return { outBuffer, outMime, ext };
}

// Routes

// Waitlist Signup Endpoint
app.post('/api/waitlist-signup', async (req, res) => {
    try {
        const { name, email, mobile } = req.body;

        // Validation
        if (!email) {
            return res.status(400).json({ error: "Email address is required" });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Please enter a valid email address" });
        }

        // Mobile number validation
        if (mobile) {
            // Remove spaces, dashes, parentheses, and plus signs for validation
            let cleanedMobile = mobile.replace(/[\s\-\(\)\+]/g, '');
            
            // Remove leading zeros (they don't count for validation)
            cleanedMobile = cleanedMobile.replace(/^0+/, '');
            
            // Check if it contains only digits
            if (!/^\d+$/.test(cleanedMobile)) {
                return res.status(400).json({ error: "Please enter a valid mobile number" });
            }
            
            // Check length (10-15 digits for international format) - internal validation
            if (cleanedMobile.length < 10 || cleanedMobile.length > 15) {
                return res.status(400).json({ error: "Please enter a valid mobile number" });
            }
            
            // Normalize mobile number (store cleaned version)
            req.body.mobile = cleanedMobile;
        }

        // Insert into Supabase
        const supabaseRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/waitlist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": process.env.SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
                "Prefer": "return=representation"
            },
            body: JSON.stringify({ name, email, mobile })
        });

        if (!supabaseRes.ok) {
            const errorText = await supabaseRes.text();
            let errorData;
            
            // Try to parse error as JSON
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }

            // Check for duplicate email error (unique constraint violation)
            // Supabase returns different error formats, check for common patterns
            const errorMessage = errorData.message || errorData.error || errorText || '';
            const isDuplicateEmail = 
                supabaseRes.status === 409 || // Conflict status
                supabaseRes.status === 23505 || // PostgreSQL unique violation code
                errorMessage.toLowerCase().includes('duplicate') ||
                errorMessage.toLowerCase().includes('unique') ||
                errorMessage.toLowerCase().includes('already exists') ||
                errorMessage.toLowerCase().includes('violates unique constraint');

            if (isDuplicateEmail) {
                // User-friendly message for duplicate email
                return res.status(409).json({ 
                    error: "This email is already registered. You're already on our waitlist!" 
                });
            }

            // Check for validation errors (400 status)
            if (supabaseRes.status === 400) {
                return res.status(400).json({ 
                    error: "Please check your information and try again" 
                });
            }

            // Log detailed error for debugging (server-side only)
            console.error("Supabase error:", {
                status: supabaseRes.status,
                statusText: supabaseRes.statusText,
                error: errorData
            });

            // Generic error message for other cases (security: don't reveal system details)
            return res.status(500).json({ 
                error: "Unable to process your request. Please try again later." 
            });
        }

        const data = await supabaseRes.json();

        // Return JSON success (React friendly)
        return res.status(200).json({
            message: "Successfully joined waitlist",
            data,
            redirect: "/thank-you.html" // Optional: for frontend to handle redirect
        });

    } catch (error) {
        // Log full error for debugging (server-side only)
        console.error("Server error:", error);
        
        // Generic error message (security: don't reveal system details)
        return res.status(500).json({ 
            error: "Unable to process your request. Please try again later." 
        });
    }
});

// Contact Form Endpoint
app.post('/api/submit-contact', async (req, res) => {
    try {
        const { name, email, role, message } = req.body;
        const recaptchaToken = req.body['g-recaptcha-response'];

        // Verify reCAPTCHA
        const captchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: recaptchaToken
            })
        });

        const captchaData = await captchaRes.json();

        if (!captchaData.success) {
            return res.status(400).json({ error: "Invalid CAPTCHA" });
        }

        // Insert into Supabase
        const supabaseRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/contact_form`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": process.env.SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
                "Prefer": "return=representation"
            },
            body: JSON.stringify({ name, email, role, message })
        });

        if (!supabaseRes.ok) {
            const errorText = await supabaseRes.text();
            console.error("Supabase insert failed:", errorText);
            return res.status(500).json({ error: "Failed to submit contact form" });
        }

        const data = await supabaseRes.json();

        // Return JSON success
        return res.status(200).json({
            message: "Contact form submitted successfully",
            data,
            redirect: "/thank-you.html"
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Storybook Price Endpoint
app.get('/api/storybook-price', (req, res) => {
    const price = parseInt(process.env.STORYBOOK_PRICE, 10);
    if (!price || price <= 0) {
        return res.status(500).json({ error: 'Price not configured' });
    }
    return res.status(200).json({ price });
});

// ── OTP: Send ────────────────────────────────────────────────────────────────
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        const cleaned = phone?.replace(/\D/g, '').replace(/^0+/, '');
        if (!cleaned || !/^\d{10}$/.test(cleaned)) {
            return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
        }

        const authKey = process.env.MSG91_AUTH_KEY;
        const templateId = process.env.MSG91_TEMPLATE_ID;
        const hasMsgKey = authKey && !authKey.includes('your_');

        if (hasMsgKey) {
            const response = await fetch('https://control.msg91.com/api/v5/otp', {
                method: 'POST',
                headers: { authkey: authKey, 'content-type': 'application/json' },
                body: JSON.stringify({
                    template_id: templateId,
                    mobile: `91${cleaned}`,
                    otp_length: 6,
                    otp_expiry: 10,
                }),
            });
            const data = await response.json();
            if (data.type !== 'success') {
                console.error('MSG91 send-otp error:', data);
                return res.status(502).json({ error: 'Failed to send OTP. Please try again.' });
            }
        } else {
            // Dev/mock mode — log the fixed OTP so developers can test
            console.log(`[DEV] OTP for ${cleaned}: 123456`);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('send-otp error:', err);
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
});

// ── OTP: Verify ───────────────────────────────────────────────────────────────
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const cleaned = phone?.replace(/\D/g, '').replace(/^0+/, '');
        if (!cleaned || !otp) {
            return res.status(400).json({ error: 'Phone and OTP are required' });
        }

        const authKey = process.env.MSG91_AUTH_KEY;
        const hasMsgKey = authKey && !authKey.includes('your_');

        let verified = false;
        if (hasMsgKey) {
            const response = await fetch(
                `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&mobile=91${cleaned}`,
                { method: 'GET', headers: { authkey: authKey } },
            );
            const data = await response.json();
            verified = data.type === 'success';
            if (!verified) console.error('MSG91 verify-otp failed:', data);
        } else {
            // Dev/mock mode — accept the fixed code 123456
            verified = String(otp).trim() === '123456';
            if (!verified) console.log(`[DEV] Wrong OTP. Expected 123456, got "${otp}"`);
        }

        if (!verified) {
            return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
        }

        // Issue a stateless signed token (valid 30 min, verifiable by any instance)
        const token = issueOtpToken(cleaned);

        res.json({ success: true, otpToken: token });
    } catch (err) {
        console.error('verify-otp error:', err);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
});

// ── OTP: Resend ───────────────────────────────────────────────────────────────
app.post('/api/resend-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        const cleaned = phone?.replace(/\D/g, '').replace(/^0+/, '');
        if (!cleaned || !/^\d{10}$/.test(cleaned)) {
            return res.status(400).json({ error: 'Invalid phone number' });
        }

        const authKey = process.env.MSG91_AUTH_KEY;
        const hasMsgKey = authKey && !authKey.includes('your_');

        if (hasMsgKey) {
            const response = await fetch(
                `https://control.msg91.com/api/v5/otp/retry?retrytype=text&mobile=91${cleaned}`,
                { method: 'GET', headers: { authkey: authKey } },
            );
            const data = await response.json();
            if (data.type !== 'success') {
                console.error('MSG91 resend-otp error:', data);
                return res.status(502).json({ error: 'Failed to resend OTP. Please try again.' });
            }
        } else {
            console.log(`[DEV] Resent OTP for ${cleaned}: 123456`);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('resend-otp error:', err);
        res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
    }
});

// Create Razorpay Order Endpoint
app.post('/api/create-order', async (req, res) => {
    try {
        const {
            childName, childAge, childGender,
            parentEmail, parentPhone,
            shippingName, addressLine1, addressLine2, city, state, pincode,
            bookSlug, photo, photoPath, photoMeta, otpToken,
        } = req.body;

        if (!childName || !childAge || !childGender || !parentEmail || !parentPhone) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate required shipping address fields
        if (!shippingName || !addressLine1 || !city || !state || !pincode) {
            return res.status(400).json({ error: 'Complete shipping address is required' });
        }
        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ error: 'Please enter a valid 6-digit PIN code' });
        }

        // Validate OTP token — stateless HMAC check, works across restarts & replicas
        const cleanedPhone = parentPhone?.replace(/\D/g, '').replace(/^(0|91)/, '');
        if (!verifyOtpToken(otpToken, cleanedPhone)) {
            return res.status(401).json({ error: 'Phone number not verified. Please complete OTP verification.' });
        }

        const price = parseInt(process.env.STORYBOOK_PRICE, 10);
        if (!price || price <= 0) {
            return res.status(500).json({ error: 'Price not configured. Please contact support.' });
        }

        // Create a Razorpay order if keys are configured. In development (or if Razorpay
        // keys are missing / placeholder), create a mock order object so we can continue
        // to test Supabase storage & DB flows without making a call to Razorpay.
        let order;
        const hasRazorpayKeys =
            process.env.RAZORPAY_KEY_ID &&
            process.env.RAZORPAY_KEY_SECRET &&
            !process.env.RAZORPAY_KEY_ID.includes('your_') &&
            !process.env.RAZORPAY_KEY_SECRET.includes('your_');

        if (hasRazorpayKeys) {
            order = await razorpay.orders.create({
                amount: price * 100,
                currency: 'INR',
                receipt: `storybook_${Date.now()}`,
            });
        } else {
            // Mock order for local/dev testing
            order = {
                id: `test_order_${Date.now()}`,
                amount: price * 100,
                currency: 'INR',
            };
            console.warn('Razorpay keys missing or placeholder — using mock order for testing.');
        }

        // Upload photo to Supabase Storage and generate a short-lived signed preview URL
        // If frontend already uploaded the photo and provided photoPath, use that instead
        let photoUrl = null;
        let photoSignedUrl = null;
        let outBuffer = null;
        let outMime = null;
        let imgWidth = null;
        let imgHeight = null;
        const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
        const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

        // processImageBuffer helper is defined at module scope (above) and reused here

        if (photoPath) {
            photoUrl = photoPath;
            // generate a signed URL for preview
            try {
                const parts = photoPath.split('/');
                const filename = parts.slice(1).join('/');
                const signRes = await fetch(
                    `${process.env.SUPABASE_URL_STORY}/storage/v1/object/sign/storybook-photos/${encodeURIComponent(filename)}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ expiresIn: 604800 }), // 7 days
                    }
                );
                if (signRes.ok) {
                    const signJson = await signRes.json();
                    photoSignedUrl = signJson.signedURL || signJson.signed_url || null;
                    if (photoSignedUrl && photoSignedUrl.startsWith('/')) {
                        if (!photoSignedUrl.startsWith('/storage/v1')) photoSignedUrl = `/storage/v1${photoSignedUrl}`;
                        photoSignedUrl = `${process.env.SUPABASE_URL_STORY}${photoSignedUrl}`;
                    }
                } else {
                    console.error('Signed URL generation failed for provided path:', await signRes.text());
                }
            } catch (err) {
                console.error('Signed URL creation error for provided path:', err);
            }
            // If client provided metadata for the already-uploaded file, use it.
            if (photoMeta) {
                try {
                    if (photoMeta.mime_type) outMime = photoMeta.mime_type;
                    if (photoMeta.file_size_bytes) outBuffer = Buffer.alloc(photoMeta.file_size_bytes);
                    if (photoMeta.width) imgWidth = photoMeta.width;
                    if (photoMeta.height) imgHeight = photoMeta.height;
                } catch (err) {
                    // ignore
                }
            }
        } else if (photo) {
            try {
                const matches = photo.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
                if (!matches) {
                    console.error('Invalid photo format');
                } else {
                    const contentType = matches[1].toLowerCase();
                    const rawBuffer = Buffer.from(matches[2], 'base64');

                    // Server-side validation
                    if (!ALLOWED_MIMES.includes(contentType)) {
                        console.error('Unsupported mime type:', contentType);
                    } else if (rawBuffer.length > MAX_UPLOAD_BYTES) {
                        console.error('Uploaded image exceeds max size:', rawBuffer.length);
                    } else {
                        // Process image: strip metadata, cap dimensions, and re-encode for safe storage
                        const proc = await processImageBuffer(rawBuffer, contentType);
                        outBuffer = proc.outBuffer;
                        outMime = proc.outMime;
                        const ext = proc.ext;

                        // Determine metadata for DB
                        try {
                            const meta = await sharp(outBuffer).metadata();
                            imgWidth = meta.width || null;
                            imgHeight = meta.height || null;
                        } catch (err) {
                            console.error('Failed to read processed image metadata:', err);
                        }

                        if (outBuffer.length > 20 * 1024 * 1024) {
                            console.error('Processed image too large:', outBuffer.length);
                        } else {
                            const filename = `${order.id}_${Date.now()}.${ext}`;

                            const uploadRes = await fetch(
                                `${process.env.SUPABASE_URL_STORY}/storage/v1/object/storybook-photos/${encodeURIComponent(filename)}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
                                        'Content-Type': outMime,
                                    },
                                    body: outBuffer,
                                }
                            );

                            if (uploadRes.ok) {
                                photoUrl = `storybook-photos/${filename}`;

                                // Generate a longer-lived signed URL for preview (1 hour)
                                try {
                                    const signRes = await fetch(
                                        `${process.env.SUPABASE_URL_STORY}/storage/v1/object/sign/storybook-photos/${encodeURIComponent(filename)}`,
                                        {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({ expiresIn: 604800 }), // 7 days
                                        }
                                    );
                                    if (signRes.ok) {
                                        const signJson = await signRes.json();
                                        photoSignedUrl = signJson.signedURL || signJson.signed_url || null;
                                        if (photoSignedUrl && photoSignedUrl.startsWith('/')) {
                                            if (!photoSignedUrl.startsWith('/storage/v1')) photoSignedUrl = `/storage/v1${photoSignedUrl}`;
                                            photoSignedUrl = `${process.env.SUPABASE_URL_STORY}${photoSignedUrl}`;
                                        }
                                    } else {
                                        console.error('Signed URL generation failed:', await signRes.text());
                                    }
                                } catch (err) {
                                    console.error('Signed URL creation error:', err);
                                }
                            } else {
                                console.error('Photo upload failed:', await uploadRes.text());
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Photo processing error:', err);
                // Non-fatal: order proceeds even if photo upload fails
            }
        }

        // Store order in Supabase (skip in dev/mock mode when URL is a placeholder)
        const hasSupabase =
            process.env.SUPABASE_URL_STORY &&
            !process.env.SUPABASE_URL_STORY.includes('your_');

        if (!hasSupabase) {
            console.warn('Supabase not configured — skipping order insert (dev/mock mode).');
            return res.status(200).json({
                orderId: order.id,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                photo_url: photoUrl,
                photo_signed_url: photoSignedUrl,
            });
        }

        const orderPayload = {
            razorpay_order_id: order.id,
            child_name: childName,
            child_age: parseInt(childAge, 10),
            child_gender: childGender,
            parent_email: parentEmail,
            parent_phone: parentPhone,
            shipping_name: shippingName,
            address_line1: addressLine1,
            address_line2: addressLine2 || null,
            city,
            state,
            pincode,
            book_slug: bookSlug || null,
            photo_url: photoUrl,
            mime_type: photoUrl ? (photoSignedUrl ? outMime : null) : null,
            original_filename: photoUrl ? (photoUrl.split('/').pop()) : null,
            file_size_bytes: photoUrl ? (outBuffer ? outBuffer.length : null) : null,
            width: imgWidth,
            height: imgHeight,
            uploaded_at: photoUrl ? new Date().toISOString() : null,
            amount: price,
            currency: 'INR',
            status: 'pending',
        };

        const supabaseRes = await fetch(`${process.env.SUPABASE_URL_STORY}/rest/v1/storybook_orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.SUPABASE_SERVICE_KEY_STORY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
                'Prefer': 'return=representation',
            },
            body: JSON.stringify(orderPayload),
        });

        if (!supabaseRes.ok) {
            const status = supabaseRes.status;
            const statusText = supabaseRes.statusText;
            let errorBody = '';
            try {
                errorBody = await supabaseRes.text();
            } catch (e) {
                errorBody = '<unable to read response body>';
            }
            console.error('Supabase insert failed', {
                status,
                statusText,
                errorBody,
                payloadPreview: {
                    razorpay_order_id: orderPayload.razorpay_order_id,
                    parent_email: orderPayload.parent_email,
                    parent_phone: orderPayload.parent_phone,
                    book_slug: orderPayload.book_slug,
                    photo_url: orderPayload.photo_url,
                    amount: orderPayload.amount,
                },
            });
        }

        return res.status(200).json({
            orderId: order.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            photo_url: photoUrl,
            photo_signed_url: photoSignedUrl,
        });
    } catch (error) {
        console.error('Create order error:', error);
        return res.status(500).json({ error: 'Unable to create order. Please try again later.' });
    }
});

// Upload photo endpoint: upload image (base64 data URL) to Supabase and return storage path + short-lived signed URL
app.post('/api/upload-photo', async (req, res) => {
    try {
        const { photo, originalSize } = req.body;
        console.log(`[upload-photo] received: originalSize=${originalSize ?? 'none'} photoLen=${photo?.length ?? 0}`);
        if (!photo) return res.status(400).json({ error: 'Missing photo' });

        const matches = photo.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches) return res.status(400).json({ error: 'Invalid photo format' });

        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        // Validate MIME and size
        const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
        const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!ALLOWED_MIMES.includes(contentType.toLowerCase())) {
            return res.status(400).json({ error: 'Unsupported mime type' });
        }
        if (buffer.length > MAX_UPLOAD_BYTES) {
            return res.status(400).json({ error: 'File too large' });
        }

        // Process image (re-encode, strip EXIF) so stored object is normalized
        const { outBuffer, outMime, ext } = await processImageBuffer(buffer, contentType.toLowerCase());

        // ── Google Vision photo quality score ─────────────────────────────────
        // Non-blocking — always proceeds with upload regardless of score.
        // Set GOOGLE_VISION_API_KEY in backend/.env to enable; absent = skipped.
        let photoQuality = null;
        const VISION_KEY = process.env.GOOGLE_VISION_API_KEY;
        if (!VISION_KEY) {
            console.log(`[upload-photo] GOOGLE_VISION_API_KEY not set — skipping quality score`);
        }
        if (VISION_KEY) {
            try {
                const visionRes = await fetch(
                    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            requests: [{
                                image: { content: outBuffer.toString('base64') },
                                features: [
                                    { type: 'FACE_DETECTION', maxResults: 5 },
                                    { type: 'IMAGE_PROPERTIES' },
                                ],
                            }],
                        }),
                    }
                );
                if (visionRes.ok) {
                    const visionJson = await visionRes.json();
                    const faces = visionJson.responses?.[0]?.faceAnnotations ?? [];

                    // Compute image dims + compression for all branches
                    const imgMeta = await sharp(outBuffer).metadata();
                    const imgW = imgMeta.width || 1;
                    const imgH = imgMeta.height || 1;
                    const imgArea = imgW * imgH;
                    const effectiveSize = originalSize ?? buffer.length;
                    const bpp = effectiveSize / imgArea;
                    const compressionScore = bpp >= 0.05 ? 10
                                           : bpp >= 0.01 ? 7
                                           : bpp >= 0.005 ? 3
                                           : 0;

                    if (faces.length === 0) {
                        photoQuality = { score: 10, tip: "We'll do our best with this photo! For an even better result, try a clear front-facing photo of your child." };
                        console.log(`Vision quality: score=10 (no face) compression=${compressionScore}(bpp=${bpp.toFixed(4)} original=${Math.round(effectiveSize/1024)}KB canvas=${Math.round(buffer.length/1024)}KB ${imgW}×${imgH})`);
                    } else if (faces.length > 1) {
                        // Multiple people — very poor, not usable for personalisation
                        photoQuality = { score: 15, tip: "Your story is on its way! For the best personalisation, a solo photo of your child works best." };
                        console.log(`Vision quality: score=15 (${faces.length} faces) compression=${compressionScore}(bpp=${bpp.toFixed(4)} original=${Math.round(effectiveSize/1024)}KB canvas=${Math.round(buffer.length/1024)}KB ${imgW}×${imgH})`);
                    } else {
                        const face = faces[0];
                        const confidence = face.detectionConfidence ?? 1;

                        // ── Face size (0–55 pts) — dominant signal ────────────────
                        // Uses fdBoundingPoly (tight around facial features) for accuracy.
                        // Score = fraction-based score × pixel multiplier so both
                        // relative size AND absolute resolution must be good to score high.
                        const fdVerts = face.fdBoundingPoly?.vertices ?? face.boundingPoly?.vertices ?? [];
                        const faceW = fdVerts.length >= 2 ? Math.abs((fdVerts[1]?.x ?? 0) - (fdVerts[0]?.x ?? 0)) : 0;
                        const faceH = fdVerts.length >= 4 ? Math.abs((fdVerts[3]?.y ?? 0) - (fdVerts[0]?.y ?? 0)) : faceW * 1.3;
                        const faceAreaFrac = (faceW * faceH) / imgArea;

                        // Fraction-based score (relative size)
                        const fracScore = faceAreaFrac >= 0.25 ? 55
                                        : faceAreaFrac >= 0.12 ? 42
                                        : faceAreaFrac >= 0.05 ? 25
                                        : faceAreaFrac >= 0.02 ? 12
                                        : 4;

                        // Pixel multiplier — use min(faceW, faceH) so both dimensions must be adequate
                        const faceMinDim = Math.min(faceW, faceH);
                        const pixelMult = faceMinDim >= 300 ? 1.0
                                        : faceMinDim >= 200 ? 0.8
                                        : faceMinDim >= 150 ? 0.55
                                        : faceMinDim >= 100 ? 0.3
                                        : 0.1;

                        const sizeScore = Math.round(fracScore * pixelMult);

                        // ── Detection confidence (0–8 pts) ───────────────────────
                        const confScore = Math.round(confidence * 8);

                        // ── Blur (0–12 pts) ───────────────────────────────────────
                        const blurScore = {
                            VERY_UNLIKELY: 12, UNLIKELY: 9, POSSIBLE: 5, LIKELY: 2, VERY_LIKELY: 0,
                        }[face.blurredLikelihood] ?? 12;

                        // ── Underexposure (0–5 pts) ───────────────────────────────
                        const exposureScore = {
                            VERY_UNLIKELY: 5, UNLIKELY: 4, POSSIBLE: 2, LIKELY: 1, VERY_LIKELY: 0,
                        }[face.underExposedLikelihood] ?? 5;

                        // ── Background uniformity (0–5 pts) ──────────────────────
                        const colors = visionJson.responses?.[0]?.imagePropertiesAnnotation?.dominantColors?.colors ?? [];
                        const topFrac = colors.length > 0 ? (colors[0].pixelFraction ?? 0) : 0;
                        const bgScore = topFrac >= 0.35 ? 5 : topFrac >= 0.20 ? 3 : topFrac >= 0.10 ? 1 : 0;

                        // ── Single face bonus (10 pts) ────────────────────────────
                        // Compression caps the total — a badly compressed photo can't score Great
                        const compressionCap = compressionScore === 0 ? 40 : compressionScore <= 3 ? 60 : 100;
                        const total = Math.min(compressionCap, sizeScore + compressionScore + confScore + blurScore + exposureScore + bgScore + 10);

                        // Tip — compression checked first as it has utmost importance
                        let tip = null;
                        if (compressionScore === 0) {
                            tip = "Your story will still be generated! For sharper illustrations, try using the original photo from your camera roll.";
                        } else if (compressionScore <= 3) {
                            tip = "We're on it! You'll get even better results with the original photo rather than a forwarded or screenshot version.";
                        } else if (faceMinDim < 100) {
                            tip = "Your story is being created! A higher resolution photo would make the illustrations look even more like your child.";
                        } else if (faceMinDim < 150) {
                            tip = "Great — your preview is on its way! A higher quality photo will make the face look even more vivid.";
                        } else if (sizeScore <= 12) {
                            tip = "Your story will be generated! Next time, a closer shot of your child's face will make the personalisation shine even more.";
                        } else if (sizeScore <= 25) {
                            tip = "Looking good! A slightly closer shot next time will make your child's face fill the frame beautifully.";
                        } else if (blurScore <= 5) {
                            tip = "We've got it! A sharper, well-lit photo next time will make the illustrations look even more stunning.";
                        } else if (exposureScore <= 2) {
                            tip = "Your story is on its way! A brighter, well-lit photo next time will bring out even more detail.";
                        } else if (bgScore === 0) {
                            tip = "All set! A plain background behind your child next time will make the personalisation pop even more.";
                        } else if (total < 75) {
                            tip = "Your preview will be ready soon! A closer, well-lit front-facing shot will make future stories look even better.";
                        }

                        photoQuality = { score: total, tip };
                        console.log(`Vision quality: score=${total} | size=${sizeScore}(area=${faceAreaFrac.toFixed(3)} face=${Math.round(faceW)}×${Math.round(faceH)}px minDim=${Math.round(faceMinDim)}px pixMult=${pixelMult}) | compression=${compressionScore}(bpp=${bpp.toFixed(4)} original=${Math.round(effectiveSize/1024)}KB canvas=${Math.round(buffer.length/1024)}KB ${imgW}×${imgH}) | conf=${confScore}(${confidence.toFixed(2)}) | blur=${blurScore}(${face.blurredLikelihood}) | exposure=${exposureScore}(${face.underExposedLikelihood}) | bg=${bgScore}(topFrac=${topFrac.toFixed(2)}) | cap=${compressionCap}`);
                    }
                } else {
                    console.warn('Vision API HTTP error:', visionRes.status);
                }
            } catch (visionErr) {
                console.warn('Vision API unreachable (non-blocking):', visionErr.message);
            }
        }

        const filename = `upload_${Date.now()}.${ext}`;

        const uploadRes = await fetch(
            `${process.env.SUPABASE_URL_STORY}/storage/v1/object/storybook-photos/${encodeURIComponent(filename)}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
                    'Content-Type': outMime,
                },
                body: outBuffer,
            }
        );

        if (!uploadRes.ok) {
            const txt = await uploadRes.text();
            console.error('Photo upload failed:', txt);
            return res.status(500).json({ error: 'Photo upload failed' });
        }

        const photoPath = `storybook-photos/${filename}`;

        // Generate signed URL
        const signRes = await fetch(
            `${process.env.SUPABASE_URL_STORY}/storage/v1/object/sign/storybook-photos/${encodeURIComponent(filename)}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ expiresIn: 604800 }), // 7 days
            }
        );

        let photoSignedUrl = null;
        if (signRes.ok) {
            const signJson = await signRes.json();
            photoSignedUrl = signJson.signedURL || signJson.signed_url || null;
            if (photoSignedUrl && photoSignedUrl.startsWith('/')) {
                // Ensure /storage/v1 prefix is present
                if (!photoSignedUrl.startsWith('/storage/v1')) {
                    photoSignedUrl = `/storage/v1${photoSignedUrl}`;
                }
                photoSignedUrl = `${process.env.SUPABASE_URL_STORY}${photoSignedUrl}`;
            }
        } else {
            console.error('Signed URL generation failed:', await signRes.text());
        }

        // Extract metadata
        let meta = {};
        try {
            const m = await sharp(outBuffer).metadata();
            meta = {
                mime_type: outMime,
                file_size_bytes: outBuffer.length,
                width: m.width || null,
                height: m.height || null,
                original_filename: filename,
            };
        } catch (err) {
            console.error('Failed to read image metadata:', err);
        }

        return res.status(200).json({ photo_url: photoPath, photo_signed_url: photoSignedUrl, ...meta, photo_quality: photoQuality });
    } catch (err) {
        console.error('Upload photo error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get signed photo URL for an order (short-lived). orderId is the razorpay_order_id.
app.get('/api/orders/:orderId/photo', async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

        // Fetch order row from Supabase
        const supabaseRes = await fetch(
            `${process.env.SUPABASE_URL_STORY}/rest/v1/storybook_orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=photo_url,parent_email,parent_phone`,
            {
                method: 'GET',
                headers: {
                    'apikey': process.env.SUPABASE_SERVICE_KEY_STORY,
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
                },
            }
        );

        if (!supabaseRes.ok) {
            const txt = await supabaseRes.text();
            console.error('Failed to fetch order:', txt);
            return res.status(500).json({ error: 'Failed to fetch order' });
        }

        const rows = await supabaseRes.json();
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        const order = rows[0];
        if (!order.photo_url) return res.status(404).json({ error: 'No photo for this order' });

        // Generate signed URL
        const path = order.photo_url; // e.g., storybook-photos/filename.png
        const filename = path.split('/').slice(1).join('/');
        const signRes = await fetch(
            `${process.env.SUPABASE_URL_STORY}/storage/v1/object/sign/storybook-photos/${encodeURIComponent(filename)}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ expiresIn: 604800 }), // 7 days
            }
        );

        if (!signRes.ok) {
            const txt = await signRes.text();
            console.error('Signed URL generation failed:', txt);
            return res.status(500).json({ error: 'Failed to create signed URL' });
        }

        const signJson = await signRes.json();
        let signedUrl = signJson.signedURL || signJson.signed_url || null;
        if (signedUrl && signedUrl.startsWith('/')) {
            if (!signedUrl.startsWith('/storage/v1')) signedUrl = `/storage/v1${signedUrl}`;
            signedUrl = `${process.env.SUPABASE_URL_STORY}${signedUrl}`;
        }

        return res.status(200).json({ signed_url: signedUrl });
    } catch (err) {
        console.error('Get photo signed URL error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Verify Razorpay Payment Endpoint
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment verification fields' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // Update order status in Supabase
        const supabaseRes = await fetch(
            `${process.env.SUPABASE_URL_STORY}/rest/v1/storybook_orders?razorpay_order_id=eq.${razorpay_order_id}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.SUPABASE_SERVICE_KEY_STORY,
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify({
                    status: 'paid',
                    razorpay_payment_id,
                }),
            }
        );

        if (!supabaseRes.ok) {
            const errorText = await supabaseRes.text();
            console.error('Supabase update failed:', errorText);
        }

        // Increment coupon uses_count if a coupon was used on this order
        try {
            const headers = {
                'apikey': process.env.SUPABASE_SERVICE_KEY_STORY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
            };
            // Look up the order to get coupon_code
            const orderRes = await fetch(
                `${process.env.SUPABASE_URL_STORY}/rest/v1/storybook_orders?razorpay_order_id=eq.${razorpay_order_id}&select=coupon_code`,
                { headers }
            );
            const [order] = await orderRes.json().catch(() => []);
            if (order?.coupon_code) {
                // Get current uses_count
                const couponRes = await fetch(
                    `${process.env.SUPABASE_URL_STORY}/rest/v1/coupons?code=eq.${encodeURIComponent(order.coupon_code)}&select=uses_count`,
                    { headers }
                );
                const [coupon] = await couponRes.json().catch(() => []);
                if (coupon != null) {
                    await fetch(
                        `${process.env.SUPABASE_URL_STORY}/rest/v1/coupons?code=eq.${encodeURIComponent(order.coupon_code)}`,
                        {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', ...headers },
                            body: JSON.stringify({ uses_count: (coupon.uses_count || 0) + 1 }),
                        }
                    );
                }
            }
        } catch (e) {
            console.error('Coupon increment error (non-fatal):', e);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Verify payment error:', error);
        alertDiscord('Payment Verification Failed', error?.message, { jobId: req.body?.razorpay_order_id });
        return res.status(500).json({ error: 'Payment verification failed' });
    }
});

// POST /api/order/send-confirmation-email
// Fire-and-forget after payment verification. Fetches order from Supabase and
// sends a branded HTML confirmation email to the parent.
app.post('/api/order/send-confirmation-email', async (req, res) => {
  try {
    const { razorpayOrderId } = req.body;
    if (!razorpayOrderId) return res.status(400).json({ error: 'razorpayOrderId required' });

    const SUPABASE_URL = process.env.SUPABASE_URL_STORY;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY_STORY;
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

    // Fetch order
    const orderRes = await fetch(
      `${SUPABASE_URL}/rest/v1/storybook_orders?razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&select=child_name,parent_email,book_slug,amount,shipping_name,address_line1,address_line2,city,state,pincode`,
      { headers }
    );
    const [order] = await orderRes.json();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.parent_email) return res.json({ skipped: true, reason: 'No email on order' });

    const childName = order.child_name || 'Your child';
    const themeName = (order.book_slug || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const siteUrl = (process.env.SITE_URL || 'https://protago.in').replace(/\/$/, '');
    const addressParts = [order.address_line1, order.address_line2, order.city, order.state, order.pincode].filter(Boolean);
    const addressStr = addressParts.join(', ');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#1A1A2E;padding:24px 32px;text-align:center">
          <span style="font-size:24px;font-weight:800;color:#FF6B35;font-family:Georgia,serif">protago</span>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0">Personalised storybooks for curious kids</p>
        </td></tr>

        <!-- Hero -->
        <tr><td style="padding:32px 32px 24px;text-align:center">
          <p style="font-size:40px;margin:0 0 12px">🎉</p>
          <p style="font-size:12px;font-weight:700;color:#FF6B35;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px">Order confirmed!</p>
          <h1 style="font-size:26px;font-weight:800;color:#1A1A2E;margin:0 0 8px;line-height:1.2">${childName}'s book is on its way!</h1>
          <p style="font-size:15px;color:#666;margin:0">We've received your order and our team is already at work crafting ${childName}'s personalised storybook.</p>
        </td></tr>

        <!-- Order details -->
        <tr><td style="padding:0 32px 24px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f5;border-radius:12px;padding:20px">
            <tr><td style="padding:8px 16px">
              <p style="margin:0;font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px">Story theme</p>
              <p style="margin:4px 0 0;font-size:15px;color:#1A1A2E;font-weight:600">${themeName || 'Personalised story'}</p>
            </td></tr>
            <tr><td style="padding:8px 16px;border-top:1px solid #eee">
              <p style="margin:0;font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px">Amount paid</p>
              <p style="margin:4px 0 0;font-size:15px;color:#1A1A2E;font-weight:600">₹${order.amount}</p>
            </td></tr>
            <tr><td style="padding:8px 16px;border-top:1px solid #eee">
              <p style="margin:0;font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px">Delivery address</p>
              <p style="margin:4px 0 0;font-size:15px;color:#1A1A2E;font-weight:600">${order.shipping_name}</p>
              <p style="margin:2px 0 0;font-size:14px;color:#666">${addressStr}</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- What's next -->
        <tr><td style="padding:0 32px 24px">
          <h2 style="font-size:16px;font-weight:700;color:#1A1A2E;margin:0 0 12px">What happens next?</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" valign="top" style="padding:0 12px 12px 0"><span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#FF6B35;color:#fff;font-weight:800;font-size:13px;text-align:center;line-height:28px">1</span></td>
              <td valign="top" style="padding:0 0 12px"><p style="margin:0;font-size:14px;color:#444;line-height:1.5">Our AI places <strong>${childName}</strong>'s face into every scene of the story.</p></td>
            </tr>
            <tr>
              <td width="32" valign="top" style="padding:0 12px 12px 0"><span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#FF6B35;color:#fff;font-weight:800;font-size:13px;text-align:center;line-height:28px">2</span></td>
              <td valign="top" style="padding:0 0 12px"><p style="margin:0;font-size:14px;color:#444;line-height:1.5">The book is printed on <strong>premium 200GSM glossy paper</strong> and carefully packaged.</p></td>
            </tr>
            <tr>
              <td width="32" valign="top" style="padding:0 12px 12px 0"><span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#FF6B35;color:#fff;font-weight:800;font-size:13px;text-align:center;line-height:28px">3</span></td>
              <td valign="top" style="padding:0 0 12px"><p style="margin:0;font-size:14px;color:#444;line-height:1.5">Delivered to your door in <strong>5–7 business days</strong>.</p></td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 32px;text-align:center">
          <p style="font-size:14px;color:#666;margin:0 0 16px">Questions? Reach us at <a href="mailto:hello@protago.in" style="color:#FF6B35">hello@protago.in</a></p>
          <a href="${siteUrl}" style="display:inline-block;background:#1A1A2E;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:50px">
            Visit protago.in
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9f9f7;padding:20px 32px;text-align:center;border-top:1px solid #eee">
          <p style="font-size:11px;color:#aaa;margin:0">
            You received this because you placed an order at protago.in.<br>
            <a href="https://protago.in/privacy" style="color:#FF6B35">Privacy Policy</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: order.parent_email,
      subject: `🎉 Order confirmed — ${childName}'s storybook is being made!`,
      html,
    });

    console.log(`Order confirmation email sent to ${order.parent_email} for order ${razorpayOrderId}`);
    return res.json({ sent: true });
  } catch (err) {
    console.error('order/send-confirmation-email error:', err);
    return res.status(500).json({ error: 'Failed to send confirmation email' });
  }
});

// ── Order inquiry from the /home landing page form ────────────────────────────
app.post('/api/order-inquiry', async (req, res) => {
    try {
        const {
            parentName, email, phone,
            childName, childAge, childGender,
            theme, storyTheme, artStyle, storyFormat,
            deliveryType, address, addressLine1, addressLine2, city, state, pincode,
            photoPath, photoSignedUrl, additionalPhotoPaths, additionalPhotoSignedUrls, couponCode, referralSource,
            isCustomStory, customStoryBrief, dedicationMessage,
        } = req.body;

        if (!email || !phone || !childName) {
            return res.status(400).json({ error: 'Name, email and phone are required' });
        }

        const basePrice = isCustomStory
            ? (parseInt(process.env.CUSTOM_STORY_PRICE, 10) || 1980)
            : (parseInt(process.env.STORYBOOK_PRICE, 10) || 499);

        // Validate coupon server-side
        const coupon = couponCode ? await validateCouponCode(couponCode) : null;
        const { discountAmount, finalPrice: price } = applyDiscount(basePrice, coupon);

        // Create Razorpay order
        const hasRazorpayKeys =
            process.env.RAZORPAY_KEY_ID &&
            process.env.RAZORPAY_KEY_SECRET &&
            !process.env.RAZORPAY_KEY_ID.includes('your_') &&
            !process.env.RAZORPAY_KEY_SECRET.includes('your_');

        let rzpOrder;
        if (hasRazorpayKeys) {
            rzpOrder = await razorpay.orders.create({
                amount: price * 100,
                currency: 'INR',
                receipt: `inquiry_${Date.now()}`,
            });
        } else {
            rzpOrder = { id: `test_order_${Date.now()}`, amount: price * 100, currency: 'INR' };
            console.warn('Razorpay keys missing — using mock order');
        }

        const hasSupabase =
            process.env.SUPABASE_URL_STORY &&
            !process.env.SUPABASE_URL_STORY.includes('your_');

        if (hasSupabase) {
            const orderType = isCustomStory ? 'custom-story' : `theme:${storyTheme || theme || 'unknown'}`;
            console.log(`[order-inquiry][${orderType}] Inserting into Supabase:`, { email, childName, childAge, childGender, customStoryBrief: customStoryBrief?.slice(0, 60) });
            const supabaseRes = await fetch(`${process.env.SUPABASE_URL_STORY}/rest/v1/storybook_orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.SUPABASE_SERVICE_KEY_STORY,
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify({
                    razorpay_order_id: rzpOrder.id,
                    shipping_name: parentName,
                    parent_email: email,
                    parent_phone: phone,
                    child_name: childName,
                    child_age: childAge ? parseInt(childAge, 10) : null,
                    child_gender: childGender,
                    story_value: theme || null,
                    story_theme: storyTheme || null,
                    art_style: artStyle || null,
                    story_format: storyFormat || null,
                    delivery_type: deliveryType || null,
                    address_line1: addressLine1 || address || null,
                    address_line2: addressLine2 || null,
                    city: city || null,
                    state: state || null,
                    pincode: pincode || null,
                    photo_url: photoPath || null,
                    photo_signed_url: photoSignedUrl || null,
                    additional_photo_urls: (additionalPhotoPaths && additionalPhotoPaths.length) ? additionalPhotoPaths : null,
                    additional_photo_signed_urls: (additionalPhotoSignedUrls && additionalPhotoSignedUrls.length) ? additionalPhotoSignedUrls : null,
                    coupon_code: coupon ? couponCode.toUpperCase() : null,
                    discount_amount: discountAmount,
                    referral_source: referralSource || null,
                    status: 'pending',
                    amount: price,
                    currency: 'INR',
                    is_custom_story: isCustomStory || false,
                    custom_story_brief: customStoryBrief || null,
                    dedication_message: dedicationMessage || null,
                }),
            });
            if (!supabaseRes.ok) {
                const err = await supabaseRes.text();
                console.error(`[order-inquiry][${orderType}] Supabase insert failed:`, err);
                alertDiscord('Order DB Insert Failed', err, { email: req.body?.email, storySlug: req.body?.storyTheme });
                return res.status(500).json({ error: `Database error: ${err}` });
            }
            console.log(`[order-inquiry][${orderType}] Supabase insert success`);
        } else {
            console.warn('[order-inquiry] Supabase not configured — skipping DB insert. SUPABASE_URL_STORY:', process.env.SUPABASE_URL_STORY ? 'set' : 'MISSING');
        }

        return res.status(200).json({
            orderId: rzpOrder.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
        });
    } catch (error) {
        console.error('Order inquiry error:', error);
        alertDiscord('Order Inquiry Failed', error?.message, { email: req.body?.email, storySlug: req.body?.storyTheme });
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ── Coupon validation helper ────────────────────────────────────────────────
async function validateCouponCode(code) {
    if (!code) return null;
    const url = `${process.env.SUPABASE_URL_STORY}/rest/v1/coupons?code=eq.${encodeURIComponent(code.toUpperCase())}&select=*`;
    const res = await fetch(url, {
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_KEY_STORY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY_STORY}`,
        },
    });
    if (!res.ok) return null;
    const [coupon] = await res.json();
    if (!coupon) return null;
    if (!coupon.is_active) return null;
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return null;
    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) return null;
    return coupon;
}

function applyDiscount(basePrice, coupon) {
    if (!coupon) return { discountAmount: 0, finalPrice: basePrice };
    const discountAmount = coupon.discount_type === 'percent'
        ? Math.round(basePrice * coupon.discount_value / 100)
        : Math.min(coupon.discount_value, basePrice);
    return { discountAmount, finalPrice: Math.max(1, basePrice - discountAmount) };
}

// ── Validate coupon endpoint ────────────────────────────────────────────────
app.post('/api/validate-coupon', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ valid: false, error: 'No code provided' });

        const hasSupabase = process.env.SUPABASE_URL_STORY && !process.env.SUPABASE_URL_STORY.includes('your_');
        if (!hasSupabase) return res.status(200).json({ valid: false, error: 'Coupons not configured' });

        const coupon = await validateCouponCode(code);
        if (!coupon) return res.status(200).json({ valid: false, error: 'Invalid or expired coupon code' });

        const basePrice = parseInt(process.env.STORYBOOK_PRICE, 10) || 499;
        const { discountAmount, finalPrice } = applyDiscount(basePrice, coupon);

        return res.status(200).json({
            valid: true,
            discountType: coupon.discount_type,
            discountValue: coupon.discount_value,
            discountAmount,
            finalPrice,
            influencerName: coupon.influencer_name || null,
        });
    } catch (err) {
        console.error('validate-coupon error:', err);
        return res.status(500).json({ valid: false, error: 'Server error' });
    }
});

// ── Discord order alert webhook ─────────────────────────────────────────────
app.post('/api/order-alert', async (req, res) => {
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!discordUrl) return res.status(200).json({ ok: true, skipped: true });

    try {
        const record = req.body?.record || req.body;
        const msg = [
            '🛍️ **New Protago Order!**',
            `👶 Child: ${record.child_name || '—'} (${record.child_age || '—'} yrs, ${record.child_gender || '—'})`,
            `🎨 Style: ${record.art_style || '—'} · Theme: ${record.story_theme || '—'} · Value: ${record.story_value || '—'}`,
            `📦 Delivery: ${record.address_line1 || '—'}`,
            `📞 Phone: ${record.parent_phone || '—'} · ✉️ ${record.parent_email || '—'}`,
            `💰 Amount: ₹${record.amount || '—'} · Status: ${record.status || '—'}`,
        ].join('\n');

        await fetch(discordUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: msg }),
        });
        res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Discord alert failed:', err);
        res.status(200).json({ ok: true }); // don't fail the Supabase webhook
    }
});

// ── Preview job status alert ──────────────────────────────────────────────────
// Receives Supabase Database Webhook on INSERT or UPDATE of preview_jobs.
// INSERT → notifies Discord that a new preview was requested.
// UPDATE with status='done' → notifies Discord that preview is ready.
app.post('/api/preview-job-alert', async (req, res) => {
  try {
    const discordUrl = process.env.PREVIEW_DISCORD_URL;
    if (!discordUrl) return res.status(200).json({ ok: true, skipped: true, reason: 'no PREVIEW_DISCORD_URL set' });

    const { type, old_record } = req.body;
    const record = req.body?.record || req.body;
    const { id: jobId, status, child_name, story_slug, email, phone, error_message } = record;

    if (!jobId) return res.status(200).json({ ok: true, skipped: true, reason: 'no job id' });
    if (type === 'UPDATE' && status !== 'done' && status !== 'failed') {
      return res.status(200).json({ ok: true, skipped: true, reason: 'intermediate update' });
    }
    // Only act on the status transition — ignore re-fires from email_sent or other field patches
    if (type === 'UPDATE' && old_record && old_record.status === status) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'status unchanged' });
    }

    const siteUrl = (process.env.SITE_URL || 'https://protago.in').replace(/\/$/, '');
    const previewUrl = `${siteUrl}/preview/${jobId}?name=${encodeURIComponent(child_name || '')}&theme=${story_slug || ''}`;
    const themeName = (story_slug || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const phoneDisplay = phone ? `📱 Phone: +91${phone}` : null;

    let msg;
    if (type === 'INSERT' || status === 'processing') {
      msg = [
        '🔄 **New Preview Requested**',
        `👶 Child: ${child_name || '—'} · Theme: ${themeName || '—'}`,
        `✉️ Email: ${email || '—'}`,
        phoneDisplay,
      ].filter(Boolean).join('\n');
    } else if (status === 'done') {
      // Fire Meta CAPI PreviewGenerated event — enriches the frontend pixel event with server-side user data
      sendMetaCAPIEvent({
        eventName: 'PreviewGenerated',
        email, phone,
        firstName: child_name,
        eventSourceUrl: `${(process.env.SITE_URL || 'https://protago.in').replace(/\/$/, '')}/preview/${jobId}`,
        customData: { content_name: story_slug, content_category: 'preview', status: 'done' },
      });

      // Fire send-email in background — handles email_sent dedup internally
      const siteBase = (process.env.SITE_URL || 'https://protago.in').replace(/\/$/, '');
      fetch(`${siteBase}/api/preview/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      }).catch(err => {
        console.error(`preview-job-alert: send-email failed for ${jobId}:`, err.message);
        alertDiscord('Preview Email Send Failed', err.message, { jobId, storySlug: story_slug, email });
      });

      msg = [
        '✅ **Preview Ready!**',
        `👶 Child: ${child_name || '—'} · Theme: ${themeName || '—'}`,
        `✉️ Email: ${email || '—'}`,
        phoneDisplay,
        `🔗 ${previewUrl}`,
      ].filter(Boolean).join('\n');
    } else if (status === 'failed') {
      alertDiscord('Preview Job Failed', error_message, { jobId, storySlug: story_slug, email });
      msg = [
        '❌ **Preview Failed**',
        `👶 Child: ${child_name || '—'} · Theme: ${themeName || '—'}`,
        `✉️ Email: ${email || '—'}`,
        phoneDisplay,
        `🆔 Job: ${jobId}`,
        error_message ? `⚠️ ${error_message}` : null,
      ].filter(Boolean).join('\n');
    } else {
      return res.status(200).json({ ok: true, skipped: true, reason: `unhandled status: ${status}` });
    }

    await fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: msg }),
    });

    console.log(`preview-job-alert: Discord notified for job ${jobId} (${type || status})`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('preview-job-alert error:', err);
    return res.status(200).json({ ok: true }); // always 200 so Supabase doesn't retry endlessly
  }
});

// ── Face swap preview ─────────────────────────────────────────────────────────

// POST /api/preview/trigger
// Creates a preview_jobs row in Supabase DB, fires Modal async.
// Body: { storySlug, photoUrl, childName?, email?, gender?, ageGroup? }
const VALID_GENDERS = new Set(['boy', 'girl']);
const VALID_AGE_GROUPS = new Set(['young', 'middle', 'older']);

app.post('/api/preview/trigger', async (req, res) => {
  try {
    const { storySlug, photoUrl, childName, email, phone, gender, ageGroup, childAge, photoQualityScore, fbc, fbp } = req.body;
    if (!storySlug || !photoUrl) {
      return res.status(400).json({ error: 'storySlug and photoUrl are required' });
    }

    // Sanitize gender/ageGroup — allowlist only, prevents path injection
    const safeGender = VALID_GENDERS.has(gender) ? gender : undefined;
    const safeAgeGroup = VALID_AGE_GROUPS.has(ageGroup) ? ageGroup : undefined;

    // Validate email if provided
    if (email) {
      const { valid, reason } = await validateEmail(email);
      if (!valid) return res.status(400).json({ error: reason });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL_STORY || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY_STORY || process.env.SUPABASE_SERVICE_KEY;

    // Create DB row
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/preview_jobs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        story_slug: storySlug,
        photo_path: photoUrl,
        child_name: childName || null,
        email: email || null,
        phone: phone || null,
        gender: safeGender || null,
        age_group: safeAgeGroup || null,
        child_age: childAge ? parseInt(childAge, 10) : null,
        photo_quality_score: photoQualityScore != null ? parseInt(photoQualityScore, 10) : null,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('preview_jobs insert failed:', err);
      return res.status(500).json({ error: 'Failed to create preview job' });
    }

    const [job] = await createRes.json();

    console.log(`Preview job ${job.id}: photoUrl=${photoUrl} gender=${safeGender || 'none'} ageGroup=${safeAgeGroup || 'none'} email=${email || 'none'}`);

    // Fire Meta CAPI PreviewStarted event — server-side counterpart to the frontend pixel event
    sendMetaCAPIEvent({
      eventName: 'PreviewStarted',
      email, phone, fbc, fbp,
      firstName: childName,
      eventSourceUrl: `${(process.env.SITE_URL || 'https://protago.in').replace(/\/$/, '')}/theme/${storySlug}`,
      customData: { content_name: storySlug, content_category: 'preview' },
    });

    // Fire Modal async (don't await — client polls for result)
    triggerPreview({ jobId: job.id, storySlug, photoUrl, childName, gender: safeGender, ageGroup: safeAgeGroup }).catch(err => {
      console.error(`Preview job ${job.id} trigger failed:`, err.message);
      alertDiscord('Modal Trigger Failed', err.message, { jobId: job.id, storySlug, email });
    });

    return res.json({ jobId: job.id, status: 'pending' });
  } catch (err) {
    console.error('preview/trigger error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/preview/retrigger
// Re-fires Modal for the last N stuck jobs (status != 'done').
// Body: { secret, limit? }  — secret must match ADMIN_SECRET env var.
app.post('/api/preview/retrigger', async (req, res) => {
  try {
    const { secret, limit = 5, jobIds } = req.body;
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL_STORY || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY_STORY || process.env.SUPABASE_SERVICE_KEY;

    // Fetch jobs — either specific IDs or last N non-done
    let fetchUrl;
    if (jobIds && Array.isArray(jobIds) && jobIds.length) {
      fetchUrl = `${SUPABASE_URL}/rest/v1/preview_jobs?id=in.(${jobIds.join(',')})&select=id,story_slug,photo_path,child_name,gender,age_group&order=created_at.desc`;
    } else {
      fetchUrl = `${SUPABASE_URL}/rest/v1/preview_jobs?status=neq.done&select=id,story_slug,photo_path,child_name,gender,age_group&order=created_at.desc&limit=${Math.min(Number(limit), 20)}`;
    }

    const jobsRes = await fetch(fetchUrl, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
    });
    if (!jobsRes.ok) return res.status(500).json({ error: 'Failed to fetch jobs' });
    const jobs = await jobsRes.json();
    if (!jobs.length) return res.json({ triggered: [], message: 'No stuck jobs found' });

    const results = [];
    for (const job of jobs) {
      try {
        let photoUrl = job.photo_path;

        // If photo_path is a raw storage path (not a URL), re-sign it
        if (photoUrl && !photoUrl.startsWith('http')) {
          const filename = photoUrl.replace(/^storybook-photos\//, '');
          const signRes = await fetch(
            `${process.env.SUPABASE_URL_STORY}/storage/v1/object/sign/storybook-photos/${encodeURIComponent(filename)}`,
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ expiresIn: 604800 }),
            }
          );
          if (signRes.ok) {
            const { signedURL } = await signRes.json();
            photoUrl = signedURL.startsWith('http') ? signedURL : `${process.env.SUPABASE_URL_STORY}${signedURL}`;
          }
        }

        // Reset status to pending
        await fetch(`${SUPABASE_URL}/rest/v1/preview_jobs?id=eq.${job.id}`, {
          method: 'PATCH',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'pending' }),
        });

        const safeGender = VALID_GENDERS.has(job.gender) ? job.gender : undefined;
        const safeAgeGroup = VALID_AGE_GROUPS.has(job.age_group) ? job.age_group : undefined;

        triggerPreview({
          jobId: job.id,
          storySlug: job.story_slug,
          photoUrl,
          childName: job.child_name,
          gender: safeGender,
          ageGroup: safeAgeGroup,
        }).catch(err => console.error(`Retrigger job ${job.id} failed:`, err.message));

        console.log(`Retriggered preview job ${job.id} (${job.story_slug})`);
        results.push({ id: job.id, story_slug: job.story_slug, status: 'retriggered' });
      } catch (err) {
        console.error(`Retrigger error for job ${job.id}:`, err.message);
        results.push({ id: job.id, story_slug: job.story_slug, status: 'error', error: err.message });
      }
    }

    return res.json({ triggered: results });
  } catch (err) {
    console.error('preview/retrigger error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/preview/feedback
// Stores star rating + optional comment for a preview job.
// Posts to PREVIEW_DISCORD_URL so we see feedback in real time.
app.post('/api/preview/feedback', async (req, res) => {
  try {
    const { jobId, rating, comment } = req.body;
    if (!jobId || !rating) return res.status(400).json({ error: 'jobId and rating required' });

    const SUPABASE_URL = process.env.SUPABASE_URL_STORY || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY_STORY || process.env.SUPABASE_SERVICE_KEY;

    // Fetch job details to enrich the feedback record
    let child_name = null, story_slug = null, jobEmail = null, phone = null, age = null;
    if (SUPABASE_URL && SUPABASE_KEY) {
      const jobRes = await fetch(
        `${SUPABASE_URL}/rest/v1/preview_jobs?id=eq.${jobId}&select=child_name,story_slug,email,phone,child_age`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      ).catch(() => null);
      if (jobRes?.ok) {
        const [j] = await jobRes.json();
        if (j) { child_name = j.child_name; story_slug = j.story_slug; jobEmail = j.email; phone = j.phone; age = j.child_age; }
      }
    }

    // Persist in Supabase (best-effort — table may not exist yet)
    if (SUPABASE_URL && SUPABASE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/preview_feedback`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ job_id: jobId, rating, comment: comment || null, child_name, story_slug, email: jobEmail, phone, age: age ? String(age) : null }),
      }).catch(() => {});
    }

    // Notify Discord
    const discordUrl = process.env.PREVIEW_DISCORD_URL;
    if (discordUrl) {
      const themeName = story_slug ? story_slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null;
      const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
      const msg = [
        `${stars} **Preview Feedback**`,
        child_name  ? `👶 Child: ${child_name}${age ? ` (${age} yrs)` : ''}` : null,
        themeName   ? `📖 Theme: ${themeName}` : null,
        jobEmail    ? `✉️ Email: ${jobEmail}` : null,
        phone       ? `📱 Phone: +91${phone}` : null,
        comment     ? `💬 "${comment}"` : null,
      ].filter(Boolean).join('\n');
      await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg }),
      }).catch(() => {});
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('preview/feedback error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/preview/send-email
// Called by PreviewResultPage when job hits 'done'. Fetches result URLs from
// Supabase and sends a branded HTML email with both preview scenes.
app.post('/api/preview/send-email', async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: 'jobId required' });

    const SUPABASE_URL = process.env.SUPABASE_URL_STORY || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY_STORY || process.env.SUPABASE_SERVICE_KEY;

    // Fetch job from DB
    const jobRes = await fetch(
      `${SUPABASE_URL}/rest/v1/preview_jobs?id=eq.${jobId}&select=email,child_name,story_slug,result_scene_1,result_scene_2,result_scene_3,email_sent`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const [job] = await jobRes.json();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.email) return res.json({ skipped: true, reason: 'No email on this job' });
    if (job.email_sent) return res.json({ skipped: true, reason: 'Email already sent' });
    if (!job.result_scene_1) return res.status(400).json({ error: 'Preview not ready yet' });

    const SKIP_COVER_THEMES = new Set([
      'colours-shapes', 'bedtime-routines', 'numbers-maths', 'sharing-sorry', 'first-day-school',
      'managing-emotions', 'indian-festivals', 'history-india',
      'financial-literacy', 'growth-mindset', 'professions',
    ]);
    const skipCover = SKIP_COVER_THEMES.has(job.story_slug);
    const emailScene1 = skipCover ? job.result_scene_2 : job.result_scene_1;
    const emailScene2 = skipCover ? job.result_scene_3 : job.result_scene_2;

    const childName = job.child_name || 'Your child';
    const themeName = job.story_slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const siteUrl = (process.env.SITE_URL || 'https://protago.in').replace(/\/$/, '');
    const themeUrl = `${siteUrl}/theme/${job.story_slug}`;
    const previewUrl = `${siteUrl}/preview/${jobId}?name=${encodeURIComponent(childName)}&theme=${job.story_slug}`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#1A1A2E;padding:24px 32px;text-align:center">
          <span style="font-size:24px;font-weight:800;color:#FF6B35;font-family:Georgia,serif">protago</span>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0">Personalised storybooks for curious kids</p>
        </td></tr>

        <!-- Hero -->
        <tr><td style="padding:32px 32px 16px;text-align:center">
          <p style="font-size:12px;font-weight:700;color:#FF6B35;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px">✨ Preview ready!</p>
          <h1 style="font-size:26px;font-weight:800;color:#1A1A2E;margin:0 0 8px;line-height:1.2">${childName}'s storybook preview</h1>
          <p style="font-size:15px;color:#666;margin:0">${themeName} · Your child's face in every scene</p>
        </td></tr>

        <!-- Scene 1 -->
        <tr><td style="padding:16px 32px 8px">
          <img src="${emailScene1}" alt="Preview scene 1" width="536"
            style="width:100%;border-radius:12px;display:block;border:0" />
        </td></tr>

        ${emailScene2 ? `<!-- Scene 2 -->
        <tr><td style="padding:8px 32px 16px">
          <img src="${emailScene2}" alt="Preview scene 2" width="536"
            style="width:100%;border-radius:12px;display:block;border:0" />
        </td></tr>` : ''}

        <!-- CTA -->
        <tr><td style="padding:24px 32px 32px;text-align:center">
          <a href="${previewUrl}"
            style="display:inline-block;background:#1A1A2E;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 32px;border-radius:50px;margin-bottom:16px">
            View your full preview →
          </a>
          <p style="font-size:15px;color:#444;margin:0 0 20px;line-height:1.6">
            Loved what you see? Turn this into a real printed book —<br>delivered to your door in 5–7 days.
          </p>
          <a href="${themeUrl}#inline-order"
            style="display:inline-block;background:#FF6B35;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:16px 40px;border-radius:50px;font-family:Georgia,serif">
            Order this Book →
          </a>
          <p style="font-size:12px;color:#999;margin:16px 0 0">Premium 200GSM glossy paper · Starting at ₹499</p>
          <p style="font-size:13px;color:#555;margin:20px 0 0;line-height:1.7">
            📸 Share this to your Instagram story &amp; tag <strong>@protago.in</strong><br>
            Send us a screenshot on
            <a href="https://wa.me/919606037934?text=Hi!%20I%20shared%20my%20Protago%20preview%20on%20Instagram.%20Here's%20my%20screenshot%20for%20the%2020%25%20discount!"
              style="color:#FF6B35;font-weight:700;text-decoration:none">WhatsApp</a>
            to claim <strong style="color:#FF6B35">20% off</strong> your order!
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9f9f7;padding:20px 32px;text-align:center;border-top:1px solid #eee">
          <p style="font-size:11px;color:#aaa;margin:0">
            You received this because you generated a preview at protago.in.<br>
            <a href="https://protago.in/privacy" style="color:#FF6B35">Privacy Policy</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: job.email,
      subject: `✨ ${childName}'s storybook preview is ready!`,
      html,
    });

    // Mark email_sent so we don't resend
    await fetch(`${SUPABASE_URL}/rest/v1/preview_jobs?id=eq.${jobId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_sent: true }),
    });

    console.log(`Preview email sent to ${job.email} for job ${jobId}`);
    return res.json({ sent: true });
  } catch (err) {
    console.error('preview/send-email error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

// GET /api/preview/status/:jobId
// Polls Supabase DB for job status + result URLs.
app.get('/api/preview/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const SUPABASE_URL = process.env.SUPABASE_URL_STORY || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY_STORY || process.env.SUPABASE_SERVICE_KEY;

    const pollRes = await fetch(
      `${SUPABASE_URL}/rest/v1/preview_jobs?id=eq.${jobId}&select=status,result_scene_1,result_scene_2,result_scene_3,result_scene_4,result_scene_5,error_message`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!pollRes.ok) return res.status(500).json({ error: 'DB error' });

    const rows = await pollRes.json();
    if (!rows.length) return res.status(404).json({ error: 'Job not found' });

    const { status, result_scene_1, result_scene_2, result_scene_3, result_scene_4, result_scene_5, error_message } = rows[0];
    return res.json({
      status,
      resultScene1: result_scene_1,
      resultScene2: result_scene_2,
      resultScene3: result_scene_3 || null,
      resultScene4: result_scene_4 || null,
      resultScene5: result_scene_5 || null,
      error: error_message,
    });
  } catch (err) {
    console.error('preview/status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Google Reviews ────────────────────────────────────────────────────────────
// Cached in memory; refreshed every 12 hours to minimise Places API costs.
const FALLBACK_REVIEWS = {
    rating: 5.0,
    userRatingCount: 6,
    reviews: [
        {
            authorName: 'Suraj Shetty',
            authorPhoto: null,
            authorUrl: 'https://g.page/r/CfdEg8f3DVL6EAE/review',
            rating: 5,
            relativeTime: '1 month ago',
            text: 'Their custom kids book was loved by my 2 girls. They customized the book to include both sisters flying a plane together and visiting places. They will cherish these memories and share common experiences. Parents must have these books — an excellent gift for young ones.',
        },
        {
            authorName: 'A Learning Theme',
            authorPhoto: null,
            authorUrl: 'https://g.page/r/CfdEg8f3DVL6EAE/review',
            rating: 5,
            relativeTime: '2 months ago',
            text: 'Such a beautiful and thoughtful gift for kids 🥹📚✨ Seeing her own name, photos & story inside the book made her genuinely so happy 💖 The quality, illustrations and little details are absolutely lovely. A truly special keepsake for little ones.',
        },
        {
            authorName: 'Jayam Chandra',
            authorPhoto: null,
            authorUrl: 'https://g.page/r/CfdEg8f3DVL6EAE/review',
            rating: 5,
            relativeTime: '3 weeks ago',
            text: 'My kid loves the book. He is so excited watching his version of images and is able to relate with the story better as it gives a tinge of personalization.',
        },
        {
            authorName: 'Tanya Bhardwaj',
            authorPhoto: null,
            authorUrl: 'https://g.page/r/CfdEg8f3DVL6EAE/review',
            rating: 5,
            relativeTime: '2 weeks ago',
            text: 'The book and the detailing was so amazing — it even captured my pimple patch and the story was wonderful. Best book ever.',
        },
    ],
};

let reviewsCache = null;
let reviewsCacheTime = 0;  // set to 0 to force re-fetch on next request
const REVIEWS_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

app.get('/api/reviews', async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        const placeId = process.env.GOOGLE_PLACE_ID;

        // Return cached data if fresh
        if (reviewsCache && Date.now() - reviewsCacheTime < REVIEWS_CACHE_TTL) {
            return res.json(reviewsCache);
        }

        if (!apiKey || !placeId) {
            return res.json(FALLBACK_REVIEWS);
        }

        const url = `https://places.googleapis.com/v1/places/${placeId}`;
        const placesRes = await fetch(url, {
            headers: {
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'rating,userRatingCount,reviews.authorAttribution,reviews.rating,reviews.relativePublishTimeDescription,reviews.text,reviews.originalText',
            },
        });

        if (!placesRes.ok) {
            console.error('Places API error:', await placesRes.text());
            return res.json(reviewsCache || FALLBACK_REVIEWS);
        }

        const data = await placesRes.json();
        const reviews = (data.reviews || []).map(r => ({
            authorName: r.authorAttribution?.displayName || 'Anonymous',
            authorPhoto: r.authorAttribution?.photoUri || null,
            authorUrl: r.authorAttribution?.uri || null,
            rating: r.rating || 5,
            relativeTime: r.relativePublishTimeDescription || '',
            text: r.text?.text || r.originalText?.text || '',
        }));

        reviewsCache = {
            rating: data.rating || FALLBACK_REVIEWS.rating,
            userRatingCount: data.userRatingCount || FALLBACK_REVIEWS.userRatingCount,
            reviews: reviews.length >= 2 ? reviews : FALLBACK_REVIEWS.reviews,
        };
        reviewsCacheTime = Date.now();

        return res.json(reviewsCache);
    } catch (err) {
        console.error('Reviews fetch error:', err);
        return res.json(reviewsCache || FALLBACK_REVIEWS);
    }
});

// ── Blog endpoints ────────────────────────────────────────────────────────────
import { generateBlogPost, TOPICS } from './blog-generator.js';

const BLOG_SB_URL = process.env.SUPABASE_URL_STORY;
const BLOG_SB_KEY = process.env.SUPABASE_SERVICE_KEY_STORY;
const BLOG_SECRET = process.env.BLOG_GEN_SECRET;

async function blogFetch(method, path, body) {
  const res = await fetch(`${BLOG_SB_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: BLOG_SB_KEY, Authorization: `Bearer ${BLOG_SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return res.ok ? JSON.parse(text || '[]') : (() => { throw new Error(text); })();
}

// List available topics
app.get('/api/blog/topics', (req, res) => {
  if (req.query.secret !== BLOG_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  res.json(TOPICS.map((t, i) => ({ index: i, title: t.title, category: t.category })));
});

// Generate a new draft post
app.post('/api/blog/generate', async (req, res) => {
  if (req.query.secret !== BLOG_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const topicParam = req.body?.topicIndex != null ? TOPICS[req.body.topicIndex] : null;
    const post = await generateBlogPost(topicParam);
    res.json({ ok: true, post });
  } catch (err) {
    console.error('blog/generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List all posts (admin: all; public: published only)
app.get('/api/blog', async (req, res) => {
  try {
    const isAdmin = req.query.secret === BLOG_SECRET;
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const offset = (page - 1) * limit;
    const filter = isAdmin ? '' : '&published=eq.true';
    const posts = await blogFetch('GET',
      `blog_posts?select=id,slug,title,excerpt,category,tags,cover_image_url,published,published_at,created_at&order=created_at.desc&limit=${limit}&offset=${offset}${filter}`,
      null
    );
    res.json({ posts, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single post by slug
app.get('/api/blog/:slug', async (req, res) => {
  try {
    const isAdmin = req.query.secret === BLOG_SECRET;
    const filter = isAdmin ? '' : '&published=eq.true';
    const rows = await blogFetch('GET',
      `blog_posts?slug=eq.${encodeURIComponent(req.params.slug)}${filter}&limit=1`,
      null
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish / unpublish a post
app.patch('/api/blog/:id', async (req, res) => {
  if (req.query.secret !== BLOG_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { published } = req.body;
    await blogFetch('PATCH',
      `blog_posts?id=eq.${req.params.id}`,
      { published, published_at: published ? new Date().toISOString() : null }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a draft post
app.delete('/api/blog/:id', async (req, res) => {
  if (req.query.secret !== BLOG_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await blogFetch('DELETE', `blog_posts?id=eq.${req.params.id}`, null);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
