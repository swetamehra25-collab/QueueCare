import { NavLink } from "react-router-dom";
import { Activity, AlertTriangle, CalendarDays, LayoutDashboard, Stethoscope, Users, X } from "lucide-react";

const links = [
  { to: "/", label: "Overview", Icon: LayoutDashboard, end: true },
  { to: "/patients", label: "Patients", Icon: Users },
  { to: "/appointments", label: "Appointments", Icon: CalendarDays },
  { to: "/doctors", label: "Doctors", Icon: Stethoscope },
  { to: "/emergency", label: "Emergency", Icon: AlertTriangle, urgent: true },
];

export default function Sidebar({ isOpen = false, onNavigate = () => {} }) {
  return (
    <aside className={`sidebar${isOpen ? " sidebar-open" : ""}`}>
      <div className="sidebar-top">
        <div className="brand-lockup"><span className="brand-mark"><Activity size={21} /></span><span>QueueCare</span></div>
        <button className="icon-button sidebar-close" aria-label="Close navigation" onClick={onNavigate}><X size={20} /></button>
      </div>
      <div className="facility-switcher"><span className="facility-icon">✚</span><span><b>Northside Medical</b><small>Care center · Main</small></span><span className="switch-chevron">⌄</span></div>
      <span className="nav-caption">WORKSPACE</span>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map(({ to, label, Icon, end, urgent }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `nav-link${isActive ? " active" : ""}${urgent ? " nav-urgent" : ""}`}>
            <Icon size={18} strokeWidth={1.9} /><span>{label}</span>{urgent && <i className="nav-dot" />}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-status"><span className="status-pulse" /><div><b>All systems operational</b><small>Last synced just now</small></div></div>
        <div className="sidebar-help"><span>?</span><div><b>Need a hand?</b><small>Visit our help center</small></div></div>
        <p className="sidebar-version">QUEUECARE FOR TEAMS <span>v1.0</span></p>
      </div>
    </aside>
  );
}
