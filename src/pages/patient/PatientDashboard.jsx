import { useEffect, useState } from "react";
import { ArrowRight, CalendarPlus, Clock3, HeartPulse, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { get } from "../../services/api";
import { formatDate, displayTime, todayISO } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import "../../styles/patient-dashboard.css";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    get("/portal/appointments")
      .then(({ data }) => { setAppointments(data); setError(""); })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const next = appointments.find((appointment) => ["scheduled", "waiting", "in-consultation"].includes(appointment.status) && new Date(appointment.date).toISOString().slice(0, 10) >= todayISO());
  const today = next && new Date(next.date).toISOString().slice(0, 10) === todayISO();
  return (
    <div className="patient-page patient-dashboard-page">
      <div className="patient-page-intro"><span className="eyebrow">YOUR QUEUECARE PORTAL</span><h2>Welcome, {user.name?.split(" ")[0]}.</h2><p>Your care journey, thoughtfully organized.</p></div>
      <div className="patient-stat-row">
        <div className="patient-stat-card"><span className="patient-stat-icon"><CalendarPlus size={19} /></span><div><b>{appointments.filter((item) => ["scheduled", "waiting", "in-consultation"].includes(item.status)).length}</b><small>Upcoming visits</small></div></div>
        <div className="patient-stat-card"><span className="patient-stat-icon patient-stat-blue"><HeartPulse size={19} /></span><div><b>{user.patientId || "—"}</b><small>Your patient ID</small></div></div>
        <Link className="patient-stat-card patient-book-shortcut" to="/portal/book"><span className="patient-stat-icon patient-stat-peach"><Stethoscope size={19} /></span><div><b>Book a visit</b><small>Find your care team</small></div><ArrowRight size={16} /></Link>
      </div>
      {error ? <div className="notice notice-error"><span>{error}</span></div> : loading ? <div className="page-loading"><span className="spinner" /> Loading your appointments…</div> : (
        <section className="panel patient-next-panel">
          <div className="panel-heading"><div><span className="eyebrow">NEXT STEP</span><h2>{next ? "Your next appointment" : "Ready when you are"}</h2></div><Link className="text-link" to="/portal/appointments">All appointments <ArrowRight size={15} /></Link></div>
          {next ? <div className="patient-next-card">
            <div className="patient-next-date"><b>{formatDate(next.date, { month: "short", day: "numeric", timeZone: "UTC" })}</b><span>{displayTime(next.time)}</span></div>
            <div className="patient-doctor-avatar">{(next.doctor?.name || "D")[0]}</div>
            <div className="patient-next-copy"><b>Dr. {next.doctor?.name}</b><span>{next.doctor?.specialty} · {next.type}</span></div>
            <span className={`status-tag status-${next.status}`}>{next.status.replace("-", " ")}</span>
            {today && next.tokenNumber && <div className="patient-token-summary"><span>Your token</span><b>#{next.tokenNumber}</b>{next.status === "waiting" && <small>{next.queuePosition > 1 ? `${next.queuePosition - 1} patient${next.queuePosition === 2 ? "" : "s"} ahead` : "You’re next"}</small>}</div>}
          </div> : <div className="patient-empty"><div className="empty-icon"><CalendarPlus size={19} /></div><b>No upcoming visits</b><span>Book an appointment whenever you’re ready. Your confirmation and token will appear here.</span><Link className="button button-primary" to="/portal/book">Find a doctor <ArrowRight size={15} /></Link></div>}
        </section>
      )}
      <div className="patient-care-note"><Clock3 size={16} /><span><b>Plans change. We understand.</b> You can track or cancel future scheduled visits from your appointments.</span><Link to="/portal/appointments">Manage visits</Link></div>
    </div>
  );
}
