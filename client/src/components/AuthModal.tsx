// client/src/components/AuthModal.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AuthModal({ redirectPath }: { redirectPath?: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      try {
        const snap = await getDoc(doc(db, "users", cred.user.uid));
        if (snap.exists()) console.log("User profile:", snap.data());
      } catch {
        /* ignore */
      }

      localStorage.setItem("auth", "true");
      setMsg("🎉 Welcome back! You’ve logged in successfully.");
      setTimeout(() => navigate(redirectPath || "/home", { replace: true }), 900);
    } catch (error: any) {
      setErr(error?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // --- modal + card styles ---
  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  };

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 380,         // compact width
    minHeight: 420,        // a little height
    background: "#fff",
    border: "1px solid #e9edf3",
    borderRadius: 12,
    boxShadow: "0 14px 34px rgba(16,24,40,0.12)",
    padding: "30px 24px",  // more vertical padding
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };

  const h1: React.CSSProperties = {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    textAlign: "center",
    color: "#111827",
  };

  const sub: React.CSSProperties = {
    margin: "6px 0 18px",
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  };

  const label: React.CSSProperties = { fontSize: 13, color: "#374151" };

  const inputWrap: React.CSSProperties = { marginTop: 4, marginBottom: 16 };

  const input: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 0",
    outline: "none",
    fontSize: 15,
    background: "transparent",
    color: "#111827",
  };

  const inputFocus: React.CSSProperties = { borderBottom: "1px solid #8b5cf6" };

  const btn: React.CSSProperties = {
    width: "100%",
    background: "linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 28,
    padding: "14px 20px",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    marginTop: 10,
    boxShadow: "0 14px 36px rgba(139, 92, 246, 0.28)",
    transition: "transform .12s ease, box-shadow .12s ease, filter .12s ease",
  };

  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  };

  const ghostBtn: React.CSSProperties = {
    background: "#fff",
    color: "#333",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
  };

  const textBtn: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: 13,
  };

  return (
    <div style={overlay}>
      {/* Scoped styles to enable placeholder color */}
      <style>{`
        .auth-card input::placeholder { color: #9ca3af; opacity: 1; }
      `}</style>

      <form onSubmit={handleLogin} style={card} className="auth-card">
        <h1 style={h1}>Sign in</h1>
        <div style={sub}>Welcome back! Please enter your details</div>

        {/* Email */}
        <label style={label}>Email</label>
        <div style={inputWrap}>
          <input
            style={input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocus)}
            onBlur={(e) => (e.currentTarget.style.borderBottom = "1px solid #e5e7eb")}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        {/* Password */}
        <label style={label}>Password</label>
        <div style={inputWrap}>
          <input
            style={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocus)}
            onBlur={(e) => (e.currentTarget.style.borderBottom = "1px solid #e5e7eb")}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </div>

        {/* Error + Success banners */}
        {err && (
          <div style={{ marginTop: 4, color: "#b91c1c", fontSize: 13, background: "#fef2f2", padding: 10, borderRadius: 10 }}>
            {err}
          </div>
        )}
        {msg && (
          <div style={{ marginTop: 4, color: "#065f46", fontSize: 13, background: "#ecfdf5", padding: 10, borderRadius: 10 }}>
            {msg}
          </div>
        )}

        <button
          type="submit"
          style={btn}
          disabled={loading}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 18px 44px rgba(139, 92, 246, 0.34)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 14px 36px rgba(139, 92, 246, 0.28)";
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        {/* Secondary actions */}
        <div style={row}>
          <button type="button" style={ghostBtn} onClick={() => navigate("/signup")}>
            New User? Sign Up
          </button>

          <button
            type="button"
            style={{ ...textBtn, marginLeft: "auto" }}
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  );
}
