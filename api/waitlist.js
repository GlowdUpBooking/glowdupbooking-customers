export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, city, source } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Invalid email." });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Server is missing Supabase env vars." });
    }
    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: "Server is missing Resend API key." });
    }

    // 1) Save to Supabase
    const insert = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify([
        {
          email: cleanEmail,
          city: city || null,
          source: source || "glowdupbooking.com",
        },
      ]),
    });

    if (!insert.ok) {
      const t = await insert.text();
      return res.status(500).json({ error: `Supabase insert failed: ${t}` });
    }

    // 2) Send confirmation email to user (Resend)
    const userEmail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Glow’d Up Booking <onboarding@resend.dev>",
        to: [cleanEmail],
        subject: "You’re on the Glow’d Up Booking waitlist ✅",
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
            <h2 style="margin:0 0 8px 0;">You’re on the list ✅</h2>
            <p style="margin:0 0 12px 0;">
              We’ll email you as soon as Glow’d Up Booking launches in your area${city ? ` (${city})` : ""}.
            </p>
            <p style="margin:0;color:#555;font-size:13px;">
              If you didn’t request this, you can ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!userEmail.ok) {
      const t = await userEmail.text();
      // still succeeded storing the user; don’t hard fail the signup
      return res.status(200).json({ ok: true, warning: `Resend user email failed: ${t}` });
    }

    // 3) Notify you (optional but useful)
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Glow’d Up Booking <onboarding@resend.dev>",
        to: ["glowdupbooking@gmail.com"],
        subject: "New waitlist signup",
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
            <p><b>Email:</b> ${cleanEmail}</p>
            <p><b>City:</b> ${city || "Unknown"}</p>
            <p><b>Source:</b> ${source || "glowdupbooking.com"}</p>
          </div>
        `,
      }),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
