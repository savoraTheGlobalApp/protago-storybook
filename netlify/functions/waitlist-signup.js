// netlify/functions/waitlist-signup.js
export async function handler(event) {
    if (event.httpMethod !== "POST") {
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
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
    }
  
    const { name, email, mobile } = body;
    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email is required" }) };
    }
  
    // NOTE: add your Supabase URL and anon key as environment variables!
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
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to join waitlist" }) };
    }
  
    const data = await supabaseRes.json();
    return {
        statusCode: 302,
        headers: { Location: "/thank-you.html" },
        body: ""
      };
  }
  