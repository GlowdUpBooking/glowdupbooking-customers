import React, { useEffect, useMemo, useState } from "react";

const SOCIAL = {
  x: "https://x.com/GlowdUpBooking",
  instagram: "https://instagram.com/glowdupbooking",
  tiktok: "https://tiktok.com/@glowdupbooking",
};

function IconX() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.9 2H22l-6.8 7.8L23.5 22h-6.7l-5.2-6.8L5.6 22H2.5l7.3-8.4L.5 2h6.9l4.7 6.1L18.9 2Zm-1.2 18h1.7L6.3 3.9H4.5L17.7 20Z"
      />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm10.75 1.5a1.25 1.25 0 1 1 0 2.5a1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6a3 3 0 0 0 0-6Z"
      />
    </svg>
  );
}
function IconTikTok() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.6 2c.4 2.4 1.8 4.2 4.2 4.4v3.2c-1.5.1-2.9-.4-4.1-1.2v7.3c0 4-3.3 7.3-7.3 7.3S2 18.9 2 14.9s3.3-7.3 7.3-7.3c.4 0 .8 0 1.2.1v3.6c-.4-.2-.8-.3-1.2-.3c-2 0-3.6 1.6-3.6 3.6s1.6 3.6 3.6 3.6s3.6-1.6 3.6-3.6V2h3.1Z"
      />
    </svg>
  );
}

async function detectCity() {
  // Best effort: IP-based city (no permissions needed)
  try {
    const r = await fetch("https://ipapi.co/json/");
    if (!r.ok) throw new Error("ipapi failed");
    const j = await r.json();
    return {
      city: j.city || null,
      region: j.region || null,
      country: j.country_name || null,
    };
  } catch {
    return { city: null, region: null, country: null };
  }
}

export default function App() {
  const [email, setEmail] = useState("");
  const [loc, setLoc] = useState({ city: null, region: null, country: null });
  const [status, setStatus] = useState({ state: "idle", message: "" }); // idle | sending | success | error

  const locationLabel = useMemo(() => {
    const parts = [loc.city, loc.region].filter(Boolean);
    if (parts.length) return parts.join(", ");
    if (loc.country) return loc.country;
    return "Detecting your area…";
  }, [loc]);

  useEffect(() => {
    (async () => {
      const l = await detectCity();
      setLoc(l);
    })();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ state: "sending", message: "" });

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          city: loc.city,
          region: loc.region,
          country: loc.country,
          source: "glowdupbooking.com",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Request failed");

      setStatus({
        state: "success",
        message: "You’re on the list. We’ll notify you when booking opens in your area.",
      });
      setEmail("");
    } catch (err) {
      setStatus({
        state: "error",
        message: err?.message || "Something went wrong. Try again.",
      });
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          {/* Put your logo at: /public/logo.png */}
          <img className="logo" src="/logo.png" alt="Glow’d Up Booking logo" />
          <span>Glow’d Up Booking</span>
        </div>
      </header>

      <main className="page">
        <div className="container">
          <div className="kicker">CLIENT BOOKING • COMING SOON</div>

          <h1 className="h1">
            Book beauty
            <br />
            appointments,
            <br />
            instantly.
          </h1>

          <p className="sub">
            Glow’d Up Booking is launching client booking soon. Join the waitlist and we’ll notify you
            when booking opens in your area.
          </p>

          <section className="card">
            <div className="cardTop">
              <div>
                <div className="cardTitle">Get early access</div>
                <div className="label">Email</div>
              </div>

              <div className="pill">{locationLabel}</div>
            </div>

            <form onSubmit={onSubmit} className="formRow">
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@gmail.com"
                required
                autoComplete="email"
              />
              <button className="button" type="submit" disabled={status.state === "sending"}>
                {status.state === "sending" ? "Joining…" : "Join waitlist"}
              </button>
            </form>

            {status.state === "success" ? (
              <div className="status">{status.message}</div>
            ) : status.state === "error" ? (
              <div className="statusError">{status.message}</div>
            ) : null}

            <div className="divider" />

            <div className="followRow">
              <div className="followLabel">Follow for updates</div>
              <div className="socials">
                <a className="socialBtn" href={SOCIAL.x} target="_blank" rel="noreferrer">
                  <IconX /> X
                </a>
                <a className="socialBtn" href={SOCIAL.instagram} target="_blank" rel="noreferrer">
                  <IconInstagram /> Instagram
                </a>
                <a className="socialBtn" href={SOCIAL.tiktok} target="_blank" rel="noreferrer">
                  <IconTikTok /> TikTok
                </a>
              </div>
            </div>
          </section>

          <div className="footer">© {new Date().getFullYear()} Glow’d Up Booking</div>
        </div>
      </main>
    </>
  );
}
