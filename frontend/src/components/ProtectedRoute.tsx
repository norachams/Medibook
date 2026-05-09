import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types/auth";

interface Props {
  requiredRole: User["role"]; // "patient" | "physician"
}

// Destination to send a logged-in user who's on the wrong route
const HOME_FOR_ROLE: Record<User["role"], string> = {
  patient:   "/patient/book",
  physician: "/physician/dashboard",
};

/**
 * Wrap any route that requires authentication.
 *
 * Usage in App.tsx:
 *   <Route element={<ProtectedRoute requiredRole="patient" />}>
 *     <Route path="/patient/book" element={<BookingPage />} />
 *   </Route>
 *
 * Three outcomes:
 *   1. Not logged in            → /login
 *   2. Logged in, wrong role    → their correct home page
 *   3. Logged in, correct role  → render children via <Outlet />
 */
export default function ProtectedRoute({ requiredRole }: Props) {
  const { isAuthenticated, user } = useAuth();

  // Case 1 — not logged in at all
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Case 2 — logged in but wrong role
  if (user.role !== requiredRole) {
    return <Navigate to={HOME_FOR_ROLE[user.role]} replace />;
  }

  // Case 3 — correct role, render the protected page
  return <Outlet />;
}