// client/src/components/ProtectedRoute.tsx
import React from "react";
import { useLocation } from "react-router-dom";
import AuthModal from "./AuthModal";

/**
 * ProtectedRoute ensures that before opening Home or Get Started,
 * the AuthModal is shown if the user is not logged in.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuth = localStorage.getItem("auth") === "true";
  const location = useLocation();

  if (isAuth) return <>{children}</>;
  return <AuthModal redirectPath={location.pathname} />;
}
