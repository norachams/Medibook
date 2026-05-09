import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import PatientDashboardPage from "./pages/PatientDashboardPage";

// Placeholder pages — will be built in later steps
// const BookingPage     = () => <div className="p-8 text-lg">Patient booking page</div>;
const DashboardPage   = () => <div className="p-8 text-lg">Physician dashboard</div>;

// Redirects from "/" based on auth state and role
function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "physician") return <Navigate to="/physician/dashboard" replace />;
  return <Navigate to="/patient/book" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root — smart redirect based on auth + role */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Patient-only routes */}
          <Route element={<ProtectedRoute requiredRole="patient" />}>
            {/* <Route path="/patient/book" element={<BookingPage />} /> */}
            <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
          </Route>

          {/* Physician-only routes */}
          <Route element={<ProtectedRoute requiredRole="physician" />}>
            <Route path="/physician/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}