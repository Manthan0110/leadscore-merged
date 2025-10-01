import React, { useState } from "react";
import "../styles.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ForgotPassword: React.FC = () => {
  const [form, setForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Reset password failed");

      setMessage("✅ Password updated successfully!");
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div className="container auth-page">
      <form className="form-card" onSubmit={handleSubmit}>
        <h2 className="about-headline">Reset Password</h2>

        <label>Email</label>
        <input className="input" name="email" type="email" value={form.email} onChange={handleChange} required />

        <label>New Password</label>
        <input className="input" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} required />

        <label>Confirm Password</label>
        <input className="input" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />

        <button type="submit" className="btn-submit">Submit</button>

        {message && <div className="toast-wrap show"><div className="toast">{message}</div></div>}
      </form>
    </div>
  );
};

export default ForgotPassword;
