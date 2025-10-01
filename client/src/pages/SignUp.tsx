// client/src/pages/SignUp.tsx
import React, { useEffect, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import "../styles.css";
import "../newstyle.css";

type FormState = {
  name: string;
  email: string;
  phone: string;                         // kept in state (hidden in UI)
  userType: "Internal" | "External";     // kept in state (hidden in UI)
  password: string;
};

export default function SignUp() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    userType: "Internal",
    password: "",
  });

  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // 🔧 Make the gradient cover the true full page without 100vw issues.
  useEffect(() => {
    const html = document.documentElement;
    const prevHtmlHeight = html.style.height;

    const body = document.body;
    const prevBodyMargin = body.style.margin;
    const prevBodyBg = body.style.background;
    const prevBodyOverflowX = body.style.overflowX;
    const prevBodyMinHeight = body.style.minHeight;

    html.style.height = "100%";
    body.style.margin = "0";
    body.style.minHeight = "100%";
    body.style.overflowX = "hidden";
    body.style.background = "linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)";

    return () => {
      html.style.height = prevHtmlHeight;
      body.style.margin = prevBodyMargin;
      body.style.background = prevBodyBg;
      body.style.overflowX = prevBodyOverflowX;
      body.style.minHeight = prevBodyMinHeight;
    };
  }, []);

  function updateField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  const validateFields = (): string | null => {
    if (!form.name || form.name.trim().length < 2) return "Please enter your name (min 2 chars).";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email.";
    if (!form.password || form.password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const createAccount = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);
    setMsg(null);

    const v = validateFields();
    if (v) {
      setErr(v);
      return;
    }

    setCreating(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone || "",
        userType: form.userType || "Internal",
        verified: true,
        createdAt: serverTimestamp(),
      });

      setMsg("Account created successfully. Please login.");
      setForm((s) => ({ ...s, password: "" }));
      setTimeout(() => navigate("/login"), 900);
    } catch (error: any) {
      console.error("createAccount error:", error);
      setErr(error?.message || "Failed to create account.");
    } finally {
      setCreating(false);
    }
  };

  // --- styles ---
  const page: React.CSSProperties = {
    minHeight: "100dvh",
    display: "grid",
    placeItems: "center",
    padding: 0,
    margin: 0,
    position: "relative",
    paddingTop: 80, // space for fixed header
  };

  // Header (keep structure; update visual to match screenshot)
  const headerStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    zIndex: 1000,
    boxShadow: "0 10px 24px rgba(139,92,246,0.18)", // soft purple shadow like the image
  };

  const headerInnerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
  };

  const headerUnderline: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    background: "linear-gradient(90deg, rgba(236,72,153,0.16), rgba(139,92,246,0.16))",
    pointerEvents: "none",
  };

  const logoStyle: React.CSSProperties = {
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: 0.3,
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: 8,
    userSelect: "none",
  };

  const navLinksStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  };

  // 🔥 Gradient pill buttons (match screenshot)
  const navBtnStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: 12, // rounded rectangle (not full pill)
    border: "none",
    background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 700,
    boxShadow: "0 12px 22px rgba(139,92,246,0.28)",
    transition: "transform .12s ease, box-shadow .12s ease, filter .12s ease",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    border: "1px solid #e9edf3",
    borderRadius: 12,
    boxShadow: "0 8px 28px rgba(16,24,40,0.06)",
    padding: 28,
  };

  const h1: React.CSSProperties = { margin: 0, fontSize: 32, fontWeight: 600, textAlign: "center", color: "#111827" };
  const sub: React.CSSProperties = { margin: "6px 0 22px", fontSize: 13, color: "#6b7280", textAlign: "center" };
  const label: React.CSSProperties = { fontSize: 13, color: "#374151" };
  const inputWrap: React.CSSProperties = { marginTop: 6, marginBottom: 14 };
  const input: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid #e5e7eb",
    padding: "10px 0",
    outline: "none",
    fontSize: 14.5,
    background: "transparent",
  };
  const inputFocus: React.CSSProperties = { borderBottom: "1px solid #2563eb" };

  const btn: React.CSSProperties = {
    width: "100%",
    background: "linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 24,
    padding: "12px 18px",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 14px 38px rgba(139, 92, 246, 0.28)",
    transition: "transform .12s ease, box-shadow .12s ease, filter .12s ease",
  };

  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  };

  return (
    <div style={page}>
      {/* Fixed Inline-Styled Header */}
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <div style={logoStyle}>🚀 LeadScore Lite</div>
          <nav style={navLinksStyle}>
            <Link
              to="/home"
              style={navBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 16px 30px rgba(139,92,246,0.35)";
                e.currentTarget.style.filter = "brightness(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 12px 22px rgba(139,92,246,0.28)";
                e.currentTarget.style.filter = "none";
              }}
            >
              Home
            </Link>
            <Link
              to="/about"
              style={navBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 16px 30px rgba(139,92,246,0.35)";
                e.currentTarget.style.filter = "brightness(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 12px 22px rgba(139,92,246,0.28)";
                e.currentTarget.style.filter = "none";
              }}
            >
              About
            </Link>
            <Link
              to="/get-started"
              style={navBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 16px 30px rgba(139,92,246,0.35)";
                e.currentTarget.style.filter = "brightness(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 12px 22px rgba(139,92,246,0.28)";
                e.currentTarget.style.filter = "none";
              }}
            >
              Get Started
            </Link>
            <Link
              to="/login"
              style={navBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 16px 30px rgba(139,92,246,0.35)";
                e.currentTarget.style.filter = "brightness(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 12px 22px rgba(139,92,246,0.28)";
                e.currentTarget.style.filter = "none";
              }}
            >
              Sign in
            </Link>
          </nav>
        </div>
        <div style={headerUnderline} />
      </header>

      {/* Form */}
      <form onSubmit={createAccount} style={card}>
        <h1 style={h1}>Sign up</h1>
        <div style={sub}>Sign up to continue</div>

        {/* Name */}
        <label style={label}>Name</label>
        <div style={inputWrap}>
          <input
            style={input}
            name="name"
            type="text"
            value={form.name}
            onChange={updateField}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocus)}
            onBlur={(e) => (e.currentTarget.style.borderBottom = "1px solid #e5e7eb")}
            placeholder="Your full name"
            required
          />
        </div>

        {/* Email */}
        <label style={label}>Email</label>
        <div style={inputWrap}>
          <input
            style={input}
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocus)}
            onBlur={(e) => (e.currentTarget.style.borderBottom = "1px solid #e5e7eb")}
            placeholder="you@example.com"
            required
          />
        </div>

        {/* Password */}
        <label style={label}>Password</label>
        <div style={inputWrap}>
          <input
            style={input}
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocus)}
            onBlur={(e) => (e.currentTarget.style.borderBottom = "1px solid #e5e7eb")}
            placeholder="Minimum 6 characters"
            required
          />
        </div>

        <button
          type="submit"
          style={btn}
          disabled={creating}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 18px 46px rgba(139, 92, 246, 0.34)";
            e.currentTarget.style.filter = "brightness(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 14px 38px rgba(139, 92, 246, 0.28)";
            e.currentTarget.style.filter = "none";
          }}
        >
          {creating ? "Creating..." : "Sign up"}
        </button>

        <div style={row}>
          <input id="remember" type="checkbox" style={{ width: 16, height: 16 }} />
          <label htmlFor="remember" style={{ fontSize: 13, color: "#374151" }}>
            Remember me
          </label>
        </div>

        {err && (
          <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 13, background: "#fef2f2", padding: 8, borderRadius: 8 }}>
            {err}
          </div>
        )}
        {msg && (
          <div style={{ marginTop: 10, color: "#065f46", fontSize: 13, background: "#ecfdf5", padding: 8, borderRadius: 8 }}>
            {msg}
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "#6b7280" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2563eb", textDecoration: "underline" }}>
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
