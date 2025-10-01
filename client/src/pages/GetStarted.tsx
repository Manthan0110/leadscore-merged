// client/src/pages/GetStarted.tsx
import React, { useState } from "react";
import "../styles.css";
import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

type FormData = {
  name: string;
  email: string;
  company: string;
  pitch: string;
};

const initialForm: FormData = {
  name: "",
  email: "",
  company: "",
  pitch: "",
};

const GetStarted: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.name || formData.name.trim().length < 2) {
      return "Name must be at least 2 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Please enter a valid email address.";
    }
    if (!formData.pitch || formData.pitch.trim().length < 10) {
      return "Pitch must be at least 10 characters.";
    }
    return null;
  };

  // simple mock scoring function (replace with API call if/when available)
  const computeScore = (): number => {
    // Example: random score between 40 and 99 to look realistic
    return Math.floor(Math.random() * 60) + 40;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be logged in to submit a lead.");
      }

      // compute score (mock). If you have a backend scoring API, call it here instead.
      const score = computeScore();

      // Save lead + score in Firestore
      await addDoc(collection(db, "leads"), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        company: formData.company,
        pitch: formData.pitch,
        score,
        createdAt: serverTimestamp(),
      });

      // Toast message
      setToast(`✅ Lead submitted successfully! Score: ${score}`);

      // (Optional) native popup — remove if you don't want it
      alert(`Lead submitted successfully!\nScore: ${score}`);

      // reset form
      setFormData(initialForm);
    } catch (err: any) {
      console.error("Lead submit error:", err);
      setError(err.message || "Failed to submit lead.");
    } finally {
      setLoading(false);
      // hide toast after 3s
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="container">
      <section className="about-section" aria-labelledby="gs-title">
        <h1 id="gs-title" className="about-headline">🚀 Get Started</h1>
        <p className="about-text">
          Submit your details and instantly get an AI-powered lead score.
        </p>

        <form className="form-card" onSubmit={handleSubmit} aria-live="polite">
          <div className="form-grid">
            <div className="form-full">
              <label htmlFor="name">
                Name <span className="required">*</span>
              </label>
              <input
                id="name"
                className="input"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                id="email"
                className="input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="company">Company</label>
              <input
                id="company"
                className="input"
                type="text"
                name="company"
                placeholder="Your company name"
                value={formData.company}
                onChange={handleChange}
                autoComplete="organization"
              />
            </div>

            <div className="form-full">
              <label htmlFor="pitch">
                Pitch <span className="required">*</span>
              </label>
              <textarea
                id="pitch"
                className="input"
                name="pitch"
                placeholder="Tell us about your lead, product, or idea..."
                value={formData.pitch}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>
          </div>

          {error && <div className="field-error">{error}</div>}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Lead"}
          </button>
        </form>

        {/* Toast Notification */}
        {toast && (
          <div className="toast-wrap show" role="status" aria-live="polite">
            <div className="toast toast-success">{toast}</div>
          </div>
        )}
      </section>
    </div>
  );
};

export default GetStarted;
