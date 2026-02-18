import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, city, region, country, source } = req.body || {};
    if (!isValidEmail(email)) return res.status(400).json({ error: "Enter a valid email." });

    const location = [city, region, country].filter(Boolean).join(", ") || "Unknown";
    const subject = "Waitlist — Glow’d Up Booking";

    // 1) Notify you
    await resend.emails.send({
      from: "Glow’d Up Booking <onboarding@resend.dev>",
      to: ["glowdupbooking@gmail.com"],
      subject,
      text: `New waitlist signup:\n\nEmail: ${email}\nLocation: ${location}\nSource: ${source || "glowdupbooking.com"}\n`,
    });

    // 2) Confirm to user
    await resend.emails.send({
      from: "Glow’d Up Booking <onboarding@resend.dev>",
      to: [email],
      subject: "You’re on the Glow’d Up Booking waitlist",
      text:
        `Thanks for joining the waitlist.\n\n` +
        `We’ll notify you when booking opens in your area.\n\n` +
        `— Glow’d Up Booking`,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Server error. Try again in a moment." });
  }
}
