export async function handler(event) {
    console.log("Function triggered", event.httpMethod);
  
    if (event.httpMethod !== "POST") {
      console.log("Invalid HTTP method");
      return { statusCode: 405, body: "Method Not Allowed" };
    }
  
    let body;
    try {
        const contentType = event.headers["content-type"] || "";
        if (contentType.includes("application/json")) {
            body = JSON.parse(event.body);
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
            const querystring = require("querystring");
            body = querystring.parse(event.body);
        } else {
            throw new Error("Unsupported content type");
        }        
        console.log("Parsed body:", body);
    } catch (err) {
      console.error("Error parsing body:", err);
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
    }
  
    const { name, email, role, message } = body;
    const recaptchaToken = body['g-recaptcha-response'];
  
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
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid CAPTCHA" }) };
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
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to insert into Supabase" }) };
    }
  
    const data = await supabaseRes.json();
    console.log("Supabase insert success:", data);
  
    return {
        statusCode: 302,
        headers: { Location: "/thank-you.html" },
        body: ""
      };
  }
  