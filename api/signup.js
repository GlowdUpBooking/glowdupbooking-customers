export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { email, city, region, country } = req.body || {};
    if (!email || typeof email !== "string") return res.status(400).json({ ok: false, error: "Email is required." });

    const cleanEmail = email.trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailOk) return res.status(400).json({ ok: false, error: "Please enter a valid email." });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return res.status(500).json({ ok: false, error: "Missing RESEND_API_KEY." });

    const locationLine = [city, region, country].filter(Boolean).join(", ") || "Unknown";
    const now = new Date().toISOString();

    const send = (payload) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

    // you (admin)
    await send({
      from: "Glow’d Up Booking <onboarding@resend.dev>",
      to: ["glowdupbooking@gmail.com"],
      subject: "Waitlist Signup",
      text: `New waitlist signup:\n\nEmail: ${cleanEmail}\nLocation: ${locationLine}\nTime (UTC): ${now}\n`,
    });

    // user confirmation
    await send({
      from: "Glow’d Up Booking <onboarding@resend.dev>",
      to: [cleanEmail],
      subject: "You’re on the Glow’d Up Booking waitlist",
      text:
        `You’re in.\n\n` +
        `We’ll notify you as soon as client booking launches in your area.\n\n` +
        `Detected area: ${locationLine}\n\n` +
        `Follow for updates:\n` +
        `X: https://x.com/GlowdUpBooking\n` +
        `Instagram: https://instagram.com/glowdupbooking\n` +
        `TikTok: https://tiktok.com/@glowdupbooking\n`,
    });

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
  }
}
