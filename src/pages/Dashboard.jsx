import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarPlus, ChevronRight, CircleHelp, Clock3, Plus, Stethoscope, UserRoundPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { get, patch } from "../services/api";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/helpers";
import StatsCards from "../components/dashboard/StatsCards";
import QueueOverview from "../components/dashboard/QueueOverview";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const notify = useToast();

  async function load() {
    try {
      setSummary(await get("/dashboard"));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function completeVisit(id) {
    try {
      await patch(`/appointments/${id}/status`, { status: "completed" });
      notify("Visit marked as complete.");
      load();
    } catch (requestError) {
      notify(requestError.message, "error");
    }
  }

  if (error) return <div className="notice notice-error"><CircleHelp size={20} /><div><b>Couldn’t load your dashboard</b><p>{error}</p></div><button className="button button-outline" onClick={load}>Try again</button></div>;
  if (!summary) return <div className="page-loading"><span className="spinner" /> Loading today’s activity…</div>;

  const activityBars = summary.weeklyActivity || [];
  const peak = Math.max(1, ...activityBars.map((day) => day.count));
  return (
    <div className="page dashboard-page">
      <div className="page-intro-row">
        <div><span className="eyebrow">{formatDate(new Date(), { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</span><h2>Your clinic at a glance</h2><p>A little clarity goes a long way. Here’s the pulse of your clinic.</p></div>
        <Link className="button button-primary" to="/appointments"><Plus size={17} /> New appointment</Link>
      </div>
      <StatsCards stats={summary.stats} />
      {summary.activeEmergencies > 0 && <Link className="dashboard-emergency" to="/emergency"><AlertTriangle size={17} /><span><b>{summary.activeEmergencies} active emergency {summary.activeEmergencies === 1 ? "request" : "requests"}</b><small>Open the response desk to review and coordinate.</small></span><ChevronRight size={17} /></Link>}
      <div className="dashboard-grid">
        <QueueOverview queue={summary.queue} totalWaiting={summary.stats.waiting} onComplete={completeVisit} />
        <section className="panel activity-panel">
          <div className="panel-heading"><div><span className="eyebrow">THIS WEEK</span><h2>Patient visits</h2></div><span className="trend-badge"><ArrowUpRight size={14} /> Live</span></div>
          <div className="chart-total"><strong>{activityBars.reduce((sum, item) => sum + item.count, 0)}</strong><span> visits this week</span><span className="chart-caption">Daily check-ins</span></div>
          <div className="bar-chart" aria-label="Patient visits this week">
            {activityBars.map((day) => <div className="bar-column" key={day.label}><span className="bar-number">{day.count}</span><div className="bar-track"><i style={{ height: `${Math.max(7, (day.count / peak) * 100)}%` }} /></div><small>{day.label}</small></div>)}
          </div>
          <div className="chart-legend"><span><i /> Patients checked in</span><span className="chart-period"><ArrowDownRight size={14} /> Last 7 days</span></div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel upcoming-panel">
          <div className="panel-heading"><div><span className="eyebrow">COMING UP</span><h2>Next appointments</h2></div><Link className="text-link" to="/appointments">All appointments <ChevronRight size={15} /></Link></div>
          {summary.upcoming?.length ? summary.upcoming.slice(0, 3).map((item) => <div className="upcoming-row" key={item._id}><span className="upcoming-time"><Clock3 size={14} />{item.time}</span><div className="mini-avatar">{(item.patient?.fullName || "P")[0]}</div><div className="upcoming-name"><b>{item.patient?.fullName || "Patient"}</b><span>{item.type} · Dr. {item.doctor?.name || "Unassigned"}</span></div><span className={`status-tag status-${item.status}`}>{item.status}</span></div>) : <div className="empty-state compact-empty">No upcoming appointments today.</div>}
        </section>
        <section className="quick-actions">
          <span className="eyebrow">QUICK ACTIONS</span><h2>Make something happen.</h2><p>Shortcuts for your everyday work.</p>
          <Link to="/patients"><span className="quick-icon quick-mint"><UserRoundPlus size={19} /></span><span><b>Register a patient</b><small>Add someone new to care</small></span><ChevronRight size={17} /></Link>
          <Link to="/appointments"><span className="quick-icon quick-blue"><CalendarPlus size={19} /></span><span><b>Book an appointment</b><small>Find a time that works</small></span><ChevronRight size={17} /></Link>
          <Link to="/doctors"><span className="quick-icon quick-peach"><Stethoscope size={19} /></span><span><b>Manage care team</b><small>View clinicians & availability</small></span><ChevronRight size={17} /></Link>
        </section>
      </div>
      <div className="dashboard-footer"><span>Designed for care, built for your team.</span><span><Clock3 size={14} /> Data refreshed just now</span></div>
    </div>
  );
}
