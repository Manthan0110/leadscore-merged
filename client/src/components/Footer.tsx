import React from "react";
import { Link } from "react-router-dom";
import "../styles.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Branding */}
        <div className="footer-brand">
          <h2 className="footer-title">LeadScore Lite</h2>
          <p className="footer-tagline">
            Tiny AI scoring API + React dashboard to help teams prioritize leads
            faster and smarter.
          </p>
        </div>

        {/* Navigation */}
        <div className="footer-nav">
          <h3 className="footer-heading">Navigation</h3>
          <ul>
            <li><Link to="/" className="footer-link">Home</Link></li>
            <li><Link to="/about" className="footer-link">About</Link></li>
            <li><Link to="/get-started" className="footer-link">Get Started</Link></li>
            <li><Link to="/signup" className="footer-link">Sign Up</Link></li>
          </ul>
        </div>

        {/* Extra Info */}
        <div className="footer-info">
          <h3 className="footer-heading">Information</h3>
          <p>📧 support@leadscorelite.com</p>
          <p>📍 Pune, India</p>
          <p>© {new Date().getFullYear()} LeadScore Lite</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
