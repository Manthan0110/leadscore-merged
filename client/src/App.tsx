// client/src/App.tsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import GetStarted from "./pages/GetStarted";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const location = useLocation();

  // Define routes where header & footer should be hidden
  const hideLayoutRoutes = ["/signup", "/login"];

  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  return (
    <div className="app-root">
      {!hideLayout && <Header />}

      <main className="container">
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected pages */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/get-started"
            element={
              <ProtectedRoute>
                <GetStarted />
              </ProtectedRoute>
            }
          />

          {/* Default */}
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>

      {<Footer />}
    </div>
  );
}
