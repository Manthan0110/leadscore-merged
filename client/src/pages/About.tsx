// src/pages/About.tsx
import React, { useEffect } from "react";
import "../styles.css";

const About: React.FC = () => {
  useEffect(() => {
    const nodes = document.querySelectorAll(".creative-block, .creative-card");
    nodes.forEach((n, i) => {
      n.classList.add("entering");
      // stagger animation
      (n as HTMLElement).style.animationDelay = `${i * 80}ms`;
    });
    return () => {
      nodes.forEach((n) => n.classList.remove("entering"));
    };
  }, []);

  return (
    <div className="container">
      {/* About Us */}
      <section className="about-section creative-block">
        <h1 className="about-headline">✨ About Us</h1>
        <h2 className="about-subtitle">What is LeadScore Lite?</h2>

        <div className="creative-paragraph">
          <span className="highlight">LeadScore Lite</span> is not just another
          CRM plugin — it’s a <span className="accent">tiny AI engine</span> that
          instantly tells you which leads are worth chasing. Imagine turning a
          messy list of names into a ranked pipeline — all with
          <strong> one click</strong>.
        </div>

        <div className="creative-paragraph">
          We give each lead a <strong>score from 0–100</strong>, so your team
          knows exactly where to focus. Forget about gut instinct —
          <span className="accent"> data-backed prioritization</span> means
          faster outreach and better results.
        </div>

        <div className="creative-paragraph">
          What makes us different? Simplicity. Transparency. And speed. No heavy
          models. No black-box predictions. Just{" "}
          <span className="highlight">explainable AI</span> that works for both
          startups and growing enterprises.
        </div>
      </section>

      {/* Features */}
      <section className="about-section">
        <h2 className="about-subtitle">🌟 Key Features</h2>

        <div className="features-grid">
          <div className="feature-card creative-card">
            <h3 className="feature-title">⚡ Tiny AI Scoring API</h3>
            <p>
              Ask once, get a <span className="highlight">score in real-time</span>.
              Plug it into any form, CRM, or website flow.  
              Your sales team instantly sees which leads shine brightest.
            </p>
            <p>
              Think of it as your <span className="accent">instant advisor</span>,
              whispering: <em>“This one’s hot. Call now.”</em>
            </p>
          </div>

          <div className="feature-card creative-card">
            <h3 className="feature-title">📊 React Dashboard</h3>
            <p>
              A dashboard that feels like magic — clean charts, bold KPIs,
              instant filters.  
              See your entire funnel come alive.
            </p>
            <p>
              Built with <span className="highlight">React</span>, it’s fast,
              responsive, and <span className="accent">beautiful on any device</span>.
            </p>
          </div>

          <div className="feature-card creative-card">
            <h3 className="feature-title">📂 Lead Submission + CSV Upload</h3>
            <p>
              Got one lead? Submit it in seconds. Got hundreds? Drag, drop, and
              upload your CSV.
            </p>
            <p>
              No friction. No headaches. Just{" "}
              <span className="highlight">bulk power made simple</span>.
            </p>
          </div>

          <div className="feature-card creative-card">
            <h3 className="feature-title">🔒 Privacy-Aware</h3>
            <p>
              Your data is your data. Period.  
              Configure <span className="highlight">retention policies</span>,
              anonymize leads, or let customers opt out.
            </p>
            <p>
              Built with <span className="accent">trust at the core</span> — 
              compliance without complexity.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
