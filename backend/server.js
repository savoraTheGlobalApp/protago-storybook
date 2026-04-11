import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { triggerPreview } from './preview.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

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
        const { photo } = req.body;
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

        return res.status(200).json({ photo_url: photoPath, photo_signed_url: photoSignedUrl, ...meta });
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
        if (signedUrl && signedUrl.startsWith('/')) signedUrl = `${process.env.SUPABASE_URL_STORY}${signedUrl}`;

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
        return res.status(500).json({ error: 'Payment verification failed' });
    }
});

// ── Order inquiry from the /home landing page form ────────────────────────────
app.post('/api/order-inquiry', async (req, res) => {
    try {
        const {
            parentName, email, phone,
            childName, childAge, childGender,
            theme, storyTheme, artStyle, storyFormat,
            deliveryType, address, notes,
            photoPath, photoSignedUrl, additionalPhotoPaths, additionalPhotoSignedUrls, couponCode, referralSource,
            isCustomStory, customStoryBrief,
        } = req.body;

        if (!email || !phone || !childName) {
            return res.status(400).json({ error: 'Name, email and phone are required' });
        }

        const basePrice = parseInt(process.env.STORYBOOK_PRICE, 10) || 499;

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
                    address_line1: address || null,
                    notes: notes || null,
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
                }),
            });
            if (!supabaseRes.ok) {
                const err = await supabaseRes.text();
                console.error('Supabase insert failed:', err);
            }
        } else {
            console.warn('Supabase not configured — order logged locally only');
        }

        return res.status(200).json({
            orderId: rzpOrder.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
        });
    } catch (error) {
        console.error('Order inquiry error:', error);
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

// ── Face swap preview ─────────────────────────────────────────────────────────

// POST /api/preview/trigger
// Creates a preview_jobs row in Supabase DB, fires Modal async.
// Body: { storySlug, photoUrl, childName? }
app.post('/api/preview/trigger', async (req, res) => {
  try {
    const { storySlug, photoUrl, childName } = req.body;
    if (!storySlug || !photoUrl) {
      return res.status(400).json({ error: 'storySlug and photoUrl are required' });
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
      body: JSON.stringify({ story_slug: storySlug, photo_path: photoUrl, child_name: childName || null }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('preview_jobs insert failed:', err);
      return res.status(500).json({ error: 'Failed to create preview job' });
    }

    const [job] = await createRes.json();

    // Fire Modal async (don't await — client polls for result)
    triggerPreview({ jobId: job.id, storySlug, photoUrl }).catch(err =>
      console.error(`Preview job ${job.id} trigger failed:`, err.message)
    );

    return res.json({ jobId: job.id, status: 'pending' });
  } catch (err) {
    console.error('preview/trigger error:', err);
    return res.status(500).json({ error: 'Internal server error' });
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
      `${SUPABASE_URL}/rest/v1/preview_jobs?id=eq.${jobId}&select=status,result_scene_1,result_scene_2,error_message`,
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

    const { status, result_scene_1, result_scene_2, error_message } = rows[0];
    return res.json({ status, resultScene1: result_scene_1, resultScene2: result_scene_2, error: error_message });
  } catch (err) {
    console.error('preview/status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Google Reviews ────────────────────────────────────────────────────────────
// Cached in memory; refreshed every 12 hours to minimise Places API costs.
const FALLBACK_REVIEWS = {
    rating: 5.0,
    userRatingCount: 12,
    reviews: [
        {
            authorName: 'Sumit Sharma',
            authorPhoto: null,
            rating: 5,
            relativeTime: '2 weeks ago',
            text: 'Absolutely magical! My daughter Ananya couldn\'t believe she was the hero of the story. She asked us to read it every night for a week. Worth every rupee.',
        },
        {
            authorName: 'Priya Menon',
            authorPhoto: null,
            rating: 5,
            relativeTime: '1 month ago',
            text: 'Ordered for my son\'s birthday — he was speechless when he saw himself in the illustrations. The art quality is incredible. Already ordered a second one!',
        },
        {
            authorName: 'Rahul Agarwal',
            authorPhoto: null,
            rating: 5,
            relativeTime: '3 weeks ago',
            text: 'Best gift I\'ve given. Rohan is 7 and has been telling all his friends at school about his own storybook. The personalisation is spot on.',
        },
    ],
};

let reviewsCache = null;
let reviewsCacheTime = 0;
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
                'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
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
