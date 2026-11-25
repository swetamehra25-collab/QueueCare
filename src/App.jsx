import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import Emergency from "./pages/Emergency";
import Doctors from "./pages/Doctors";
import PatientAccess from "./pages/PatientAccess";
import PatientPortalLayout from "./components/patient/PatientPortalLayout";
import Welcome from "./pages/Welcome";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  if (loading) return <div className="screen-loader"><span className="spinner" /> Loading QueueCare…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "patient") return <Navigate to="/portal" replace />;
  return (
    <div className="app-shell">
      <Sidebar isOpen={navOpen} onNavigate={() => setNavOpen(false)} />
      {navOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} />}
      <div className="content-shell">
        <Header onMenuClick={() => setNavOpen(true)} />
        <main className="main-content">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="emergency" element={<Emergency />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen-loader"><span className="spinner" /> Loading QueueCare…</div>;
  if (!user) return <Welcome />;
  if (user.role === "patient") return <Navigate to="/portal" replace />;
  return <ProtectedLayout />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={user ? <Navigate to={user.role === "patient" ? "/portal" : "/"} replace /> : <Login />} />
      <Route path="/portal/login" element={<PatientAccess />} />
      <Route path="/portal/register" element={<PatientAccess />} />
      <Route path="/portal/*" element={<PatientPortalLayout />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
