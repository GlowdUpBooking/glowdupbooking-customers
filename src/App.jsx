import { useEffect, useMemo, useState } from "react";
import "./App.css";

function IconX() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path
        fill="currentColor"
        d="M18.244 2H21l-6.54 7.47L22 22h-6.828l-5.35-7.012L3.63 22H1l7.06-8.07L2 2h7.002l4.83 6.37L18.244 2Zm-1.196 18h1.53L7.92 3.89H6.28L17.048 20Z"
      />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path
        fill="currentColor"
        d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm6.2-2.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"
      />
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path
        fill="currentColor"
        d="M16.7 2h-2.6v13.1c0 1.6-1.3 2.9-2.9 2.9s-2.9-1.3-2.9-2.9 1.3-2.9 2.9-2.9c.4 0 .8.1 1.1.2V7.7c-.4-.1-.7-.1-1.1-.1-3.1 0-5.6 2.5-5.6 5.6s2.5 5.6 5.6 5.6 5.6-2.5 5.6-5.6V9.1c1.1 1.2 2.7 2 4.5 2V8.5c-1.5 0-2.9-.8-3.6-2.1-.4-.7-.6-1.5-.6-2.3V2Z"
      />
    </svg>
  );
}

async function reverseGeocode(lat, lon) {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
    encodeURIComponent(lat) +
    "&lon=" +
    encodeURIComponent(lon);

  const r = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!r.ok) throw new Error("Reverse geocode failed");
  const data = await r.json();
  const addr = data?.address || {};
  const city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || "";
  const region = addr.state || addr.region || "";
  const country = addr.country || "";
  return { city, region, country };
}

// safe JSON parse (prevents "Unexpected end of JSON input")
async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function App() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | locating | ready | sending | sent | error
  const [error, setError] = useState("");
  const [loc, setLoc] = useState({ city: "", region: "", country: "" });
  const [geoAllowed, setGeoAllowed] = useState(true);

  const locationLabel = useMemo(() => {
    const nice = [loc.city, loc.region].filter(Boolean).join(", ");
    return nice || "";
  }, [loc]);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      setStatus("locating");
      setError("");

      if (!("geolocation" in navigator)) {
        setGeoAllowed(false);
        setStatus("ready");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const place = await reverseGeocode(latitude, longitude);
            if (!cancelled) setLoc(place);
          } catch {
            // ignore
          } finally {
            if (!cancelled) setStatus("ready");
          }
        },
        () => {
          if (!cancelled) {
            setGeoAllowed(false);
            setStatus("ready");
          }
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
      );
    }

    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onAllowLocation() {
    setGeoAllowed(true);
    setLoc({ city: "", region: "", country: "" });
    setStatus("locating");
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const place = await reverseGeocode(latitude, longitude);
          setLoc(place);
        } catch {
          // ignore
        } finally {
          setStatus("ready");
        }
      },
      () => {
        setGeoAllowed(false);
        setStatus("ready");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailOk) {
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, ...loc }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const msg = data?.error || `Signup failed (${res.status}).`;
        throw new Error(msg);
      }

      if (!data?.ok) {
        throw new Error(data?.error || "Signup failed. Please try again.");
      }

      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Something went wrong. Please try again.");
    }
  }

  const buttonText =
    status === "sending" ? "Joining..." : status === "sent" ? "You’re on the list" : "Join waitlist";

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <img className="logo" src="/logo.png" alt="Glow'd Up Booking logo" />
          <span className="brandName">Glow’d Up Booking</span>
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <div className="kicker">CLIENT BOOKING • COMING SOON</div>

          <h1 className="title">
            Book beauty
            <br />
            appointments,
            <br />
            instantly.
          </h1>

          <p className="subtitle">
            Glow’d Up Booking is launching client booking soon. Join the waitlist and we’ll notify you when booking
            opens in your area.
          </p>

          <div className="card">
            <div className="cardTop">
              <div className="cardTitle">Get early access</div>

              <div className="chip">
                {status === "locating" ? "Detecting your city…" : locationLabel ? `Near ${locationLabel}` : ""}
                {!locationLabel && status !== "locating" && !geoAllowed ? (
                  <button type="button" className="linkBtn" onClick={onAllowLocation}>
                    Allow location
                  </button>
                ) : null}
              </div>
            </div>

            <form className="form" onSubmit={onSubmit}>
              <label className="field">
                <span>Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={status === "sending" || status === "sent"}
                />
              </label>

              <button className="cta" type="submit" disabled={status === "sending" || status === "sent"}>
                {buttonText}
              </button>
            </form>

            {error ? <div className="error">{error}</div> : null}

            {status === "sent" ? (
              <div className="success">All set. We’ll notify you as soon as Glow’d Up Booking launches in your area.</div>
            ) : null}

            <div className="followRow">
              <div className="followLabel">Follow for updates</div>

              <div className="socials">
                <a className="social" href="https://x.com/GlowdUpBooking" target="_blank" rel="noreferrer">
                  <IconX />
                  <span>X</span>
                </a>

                <a className="social" href="https://instagram.com/glowdupbooking" target="_blank" rel="noreferrer">
                  <IconInstagram />
                  <span>Instagram</span>
                </a>

                <a className="social" href="https://tiktok.com/@glowdupbooking" target="_blank" rel="noreferrer">
                  <IconTikTok />
                  <span>TikTok</span>
                </a>
              </div>
            </div>
          </div>

          <footer className="footer">© {new Date().getFullYear()} Glow’d Up Booking</footer>
        </section>
      </main>
    </div>
  );
}
