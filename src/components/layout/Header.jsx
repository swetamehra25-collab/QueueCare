import { useEffect, useRef, useState } from "react";
import { Bell, CalendarDays, LogOut, Menu, Search, Stethoscope, Users, AlertTriangle, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../utils/helpers";
import { get } from "../../services/api";
import "../../styles/admin-header.css";

const pageNames = {
  "/": ["Good morning", "Here’s what’s happening today."],
  "/patients": ["Patients", "A thoughtful view of everyone in your care."],
  "/appointments": ["Appointments", "Keep today’s visits moving smoothly."],
  "/doctors": ["Care team", "Your clinicians, all in one place."],
  "/emergency": ["Emergency desk", "Coordinate urgent care with confidence."],
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [title, subtitle] = pageNames[pathname] || pageNames["/"];
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const headerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setNotificationsOpen(false);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    }
    function handleOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    document.addEventListener("mousedown", handleOutside);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  async function loadNotifications() {
    try {
      const [dashboard, emergencies] = await Promise.all([get("/dashboard"), get("/emergencies")]);
      const items = [];
      if (dashboard.stats?.waiting) items.push({ id: "waiting", Icon: Users, title: `${dashboard.stats.waiting} patient${dashboard.stats.waiting === 1 ? "" : "s"} waiting`, detail: "Open the live queue", to: "/appointments" });
      if (dashboard.activeEmergencies) items.push({ id: "emergency", Icon: AlertTriangle, title: `${dashboard.activeEmergencies} active emergency request${dashboard.activeEmergencies === 1 ? "" : "s"}`, detail: "Review the emergency desk", to: "/emergency" });
      emergencies.data?.filter((item) => item.status !== "resolved").slice(0, 3).forEach((item) => items.push({ id: item._id, Icon: AlertTriangle, title: item.patientName || "Emergency request", detail: `${item.severity || "Normal"} severity · ${item.status || "new"}`, to: "/emergency" }));
      if (dashboard.upcoming?.length) dashboard.upcoming.slice(0, 2).forEach((item) => items.push({ id: item._id, Icon: CalendarDays, title: `${item.patient?.fullName || "Patient"} · ${item.time}`, detail: item.type || "Upcoming appointment", to: "/appointments" }));
      setNotifications(items);
      setUnread(items.length);
    } catch {
      setNotifications([{ id: "offline", Icon: Bell, title: "Notifications unavailable", detail: "Check your connection and try again", to: "/" }]);
      setUnread(1);
    }
  }

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, []);

  async function openSearch() {
    setSearchOpen(true);
    setNotificationsOpen(false);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
    if (!query.trim()) setResults([]);
  }

  async function updateSearch(value) {
    setQuery(value);
    const term = value.trim().toLowerCase();
    if (!term) { setResults([]); return; }
    try {
      const [patients, appointments, doctors] = await Promise.all([get(`/patients?search=${encodeURIComponent(term)}`), get("/appointments"), get("/doctors")]);
      const found = [];
      patients.data?.slice(0, 4).forEach((item) => found.push({ id: item._id, type: "Patient", title: item.fullName, detail: item.patientId, Icon: Users, to: "/patients" }));
      doctors.data?.filter((item) => `${item.name} ${item.specialty} ${item.department}`.toLowerCase().includes(term)).slice(0, 4).forEach((item) => found.push({ id: item._id, type: "Doctor", title: `Dr. ${item.name}`, detail: item.specialty, Icon: Stethoscope, to: "/doctors" }));
      appointments.data?.filter((item) => `${item.patient?.fullName || ""} ${item.doctor?.name || ""} ${item.type || ""}`.toLowerCase().includes(term)).slice(0, 4).forEach((item) => found.push({ id: item._id, type: "Appointment", title: item.patient?.fullName || "Patient", detail: `${item.time} · ${item.type}`, Icon: CalendarDays, to: "/appointments" }));
      setResults(found.slice(0, 8));
    } catch {
      setResults([]);
    }
  }

  function openResult(to) {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    navigate(to);
  }

  function toggleNotifications() {
    setNotificationsOpen((open) => !open);
    setSearchOpen(false);
    if (!notificationsOpen) setUnread(0);
  }

  return (
    <header className="topbar" ref={headerRef}>
      <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={onMenuClick}><Menu size={21} /></button>
      <div className="topbar-title"><h1>{title}{pathname === "/" && user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1><p>{subtitle}</p></div>
      <div className="topbar-actions">
        <button className="search-shortcut" aria-label="Search anything" onClick={openSearch}><Search size={17} /><span>Search anything</span><kbd>⌘ K</kbd></button>
        {searchOpen && <div className="header-popover search-popover"><div className="popover-search"><Search size={16} /><input ref={searchInputRef} value={query} onChange={(event) => updateSearch(event.target.value)} placeholder="Search patients, doctors, appointments…" /><button aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={15} /></button></div><div className="popover-results">{query && !results.length ? <div className="popover-empty">No matching results.</div> : results.map((item) => { const Icon = item.Icon; return <button key={`${item.type}-${item.id}`} onClick={() => openResult(item.to)}><span className="popover-result-icon"><Icon size={16} /></span><span><b>{item.title}</b><small>{item.type} · {item.detail}</small></span></button>; })}</div></div>}
        <button className="icon-button notification-button" aria-label="Notifications" onClick={toggleNotifications}><Bell size={19} />{unread > 0 && <i />}</button>
        {notificationsOpen && <div className="header-popover notification-popover"><div className="notification-heading"><b>Notifications</b><span>{notifications.length}</span></div>{notifications.length ? notifications.map((item) => { const Icon = item.Icon; return <button key={item.id} onClick={() => { setNotificationsOpen(false); navigate(item.to); }}><span className="notification-icon"><Icon size={16} /></span><span><b>{item.title}</b><small>{item.detail}</small></span></button>; }) : <div className="popover-empty">You’re all caught up.</div>}</div>}
        <div className="profile-menu"><div className="avatar avatar-small">{initials(user?.name || "QueueCare")}</div><div className="profile-copy"><b>{user?.name || "Sweta Mehra"}</b><small>{user?.role || "Staff"}</small></div><button className="logout-button" aria-label="Sign out" onClick={logout}><LogOut size={15} /><span>Sign out</span></button></div>
      </div>
    </header>
  );
}
