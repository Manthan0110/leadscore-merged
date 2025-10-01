// client/src/components/Header.tsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles.css";

export default function Header() {
  return (
    <header className="app-header">
      <div className="logo">🚀 LeadScore Lite</div>
      <nav className="nav-links">
        <Link to="/home" className="nav-btn">Home</Link>
        <Link to="/about" className="nav-btn">About</Link>
        <Link to="/get-started" className="nav-btn">Get Started</Link>
        <Link to="/login" className="nav-btn">Logout</Link>
      </nav>
    </header>
  );
}
