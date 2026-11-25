import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../utils/helpers";

const pageNames = {
  "/": ["Good morning", "Here’s what’s happening today."],
  "/patients": ["Patients", "A thoughtful view of everyone in your care."],
  "/appointments": ["Appointments", "Keep today’s visits moving smoothly."],
  "/doctors": ["Care team", "Your clinicians, all in one place."],
  "/emergency": ["Emergency desk", "Coordinate urgent care with confidence."],
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [title, subtitle] = pageNames[pathname] || pageNames["/"];
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={onMenuClick}><Menu size={21} /></button>
      <div className="topbar-title"><h1>{title}{pathname === "/" && user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1><p>{subtitle}</p></div>
      <div className="topbar-actions">
        <button className="search-shortcut" aria-label="Search patients"><Search size={17} /><span>Search anything</span><kbd>⌘ K</kbd></button>
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><i /></button>
        <div className="profile-menu"><div className="avatar avatar-small">{initials(user?.name || "QueueCare")}</div><div className="profile-copy"><b>{user?.name || "Care staff"}</b><small>{user?.role || "Staff"}</small></div><button className="logout-button" aria-label="Sign out" onClick={logout}><LogOut size={15} /><span>Sign out</span></button></div>
      </div>
    </header>
  );
}
