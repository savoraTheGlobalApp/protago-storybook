// Load environment variables from .env file (for local development)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const querystring = require('querystring');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(' Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
  console.error('\nPlease create a .env file with these variables.');
  console.error('See .env.example for reference.\n');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// API Routes - Converted from Netlify Functions

// Contact form submission endpoint
app.post('/.netlify/functions/submit-contact', async (req, res) => {
  console.log("Function triggered", req.method);

  try {
    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
      return res.status(500).json({ error: "Server configuration error. Please contact support." });
    }

    const { name, email, role, message } = req.body;
    const recaptchaToken = req.body['g-recaptcha-response'];

    // Verify reCAPTCHA
    console.log("Verifying reCAPTCHA...");
    const captchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: recaptchaToken
      })
    });

    const captchaData = await captchaRes.json();
    console.log("CAPTCHA response:", captchaData);

    if (!captchaData.success) {
      console.error("CAPTCHA verification failed");
      return res.status(400).json({ error: "Invalid CAPTCHA" });
    }

    // Insert into Supabase
    console.log("Inserting into Supabase table: contact_form");
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
      return res.status(500).json({ error: "Failed to insert into Supabase" });
    }

    const data = await supabaseRes.json();
    console.log("Supabase insert success:", data);

    return res.redirect('/thank-you.html');
  } catch (err) {
    console.error("Error parsing body:", err);
    return res.status(400).json({ error: "Invalid request body" });
  }
});

// Waitlist signup endpoint
app.post('/.netlify/functions/waitlist-signup', async (req, res) => {
  try {
    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
      return res.status(500).json({ error: "Server configuration error. Please contact support." });
    }

    const { name, email, mobile } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log("Parsed body:", req.body);

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
      console.error("Supabase insert failed:", errorText);
      return res.status(500).json({ error: "Failed to join waitlist" });
    }

    const data = await supabaseRes.json();
    console.log("Supabase insert success:", data);

    return res.redirect('/thank-you.html');
  } catch (err) {
    console.error("Error:", err);
    return res.status(400).json({ error: "Invalid request body" });
  }
});

// Handle all other routes - serve index.html for SPA-like behavior if needed
app.get('*', (req, res) => {
  // If the request is for a file that exists, express.static will handle it
  // Otherwise, serve index.html for client-side routing
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

