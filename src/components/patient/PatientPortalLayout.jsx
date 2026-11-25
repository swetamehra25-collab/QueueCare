import { useState } from "react";
import { Activity, CalendarDays, ClipboardList, HeartPulse, LogOut, Menu, X } from "lucide-react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PatientDashboard from "../../pages/patient/PatientDashboard";
import PatientBooking from "../../pages/patient/PatientBooking";
import PatientAppointments from "../../pages/patient/PatientAppointments";

const links = [
  { to: "/portal", label: "My care", Icon: Activity, end: true },
  { to: "/portal/book", label: "Find a doctor", Icon: CalendarDays },
  { to: "/portal/appointments", label: "My appointments", Icon: ClipboardList },
];

export default function PatientPortalLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  function signOut() {
    logout();
    navigate("/", { replace: true });
  }
  if (loading) return <div className="screen-loader"><span className="spinner" /> Loading QueueCare…</div>;
  if (!user) return <Navigate to="/portal/login" replace />;
  if (user.role !== "patient") return <Navigate to="/" replace />;

  return (
    <div className="patient-portal-shell">
      <aside className={`patient-sidebar${menuOpen ? " patient-sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-lockup"><span className="brand-mark"><HeartPulse size={21} /></span><span>QueueCare</span></div>
          <button className="icon-button sidebar-close patient-sidebar-close" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        </div>
        <div className="patient-welcome-card"><span className="patient-welcome-icon">✚</span><div><b>Your care portal</b><small>Northside Medical</small></div></div>
        <span className="nav-caption">PATIENT PORTAL</span>
        <nav className="sidebar-nav" aria-label="Patient navigation">
          {links.map(({ to, label, Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}><Icon size={18} /><span>{label}</span></NavLink>)}
        </nav>
        <div className="patient-sidebar-bottom"><div className="sidebar-status"><span className="status-pulse" /><div><b>Your care, in one place</b><small>Appointments and queue updates</small></div></div><button className="patient-logout" onClick={signOut}><LogOut size={15} /> Sign out</button><p className="sidebar-version">QUEUECARE PATIENT PORTAL <span>v1.0</span></p></div>
      </aside>
      {menuOpen && <button className="mobile-scrim patient-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <div className="patient-content-shell">
        <header className="topbar patient-topbar">
          <button className="icon-button mobile-menu patient-menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
          <div className="topbar-title"><h1>Your care, connected</h1><p>Appointments, clinicians, and queue updates in one place.</p></div>
          <div className="profile-menu"><div className="avatar avatar-small">{user.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div><div className="profile-copy"><b>{user.name}</b><small>Patient</small></div><button className="logout-button" aria-label="Sign out" onClick={signOut}><LogOut size={15} /><span>Sign out</span></button></div>
        </header>
        <main className="main-content patient-main">
          <Routes>
            <Route index element={<PatientDashboard />} />
            <Route path="book" element={<PatientBooking />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
