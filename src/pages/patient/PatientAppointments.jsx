import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, MapPin, TicketCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { get, post } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { displayTime, formatDate, todayISO } from "../../utils/helpers";
import "../../styles/patient-appointments.css";

export default function PatientAppointments() {
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(location.state?.confirmed || null);
  const [cancelling, setCancelling] = useState("");

  async function load(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const { data } = await get("/portal/appointments");
      setAppointments(data);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    const timer = window.setInterval(() => load(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  async function cancel(appointment) {
    if (!window.confirm("Cancel this appointment? You can book another time afterward.")) return;
    setCancelling(appointment._id);
    try {
      await post(`/portal/appointments/${appointment._id}/cancel`, {});
      notify("Your appointment has been cancelled.");
      await load();
    } catch (requestError) {
      notify(requestError.message, "error");
    } finally {
      setCancelling("");
    }
  }

  function dismissConfirmation() {
    setConfirmed(null);
    navigate(location.pathname, { replace: true, state: null });
  }

  return (
    <div className="patient-page patient-appointments-page">
      <div className="patient-page-intro"><span className="eyebrow">YOUR VISITS</span><h2>Appointments & queue tracking.</h2><p>Your confirmations and visit status, all in one place.</p></div>
      {confirmed && <section className="booking-confirmation" role="status">
        <div className="confirmation-check"><CheckCircle2 size={22} /></div><div className="confirmation-copy"><span>BOOKING CONFIRMED</span><h2>You’re all set.</h2><p>Your appointment with Dr. {confirmed.doctor?.name} is booked for {formatDate(confirmed.date, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })} at {displayTime(confirmed.time)}.</p></div>
        <div className="confirmation-token"><small>YOUR QUEUE TOKEN</small><b>#{confirmed.tokenNumber}</b></div><button className="confirmation-dismiss" onClick={dismissConfirmation} aria-label="Dismiss confirmation">×</button>
      </section>}
      {error ? <div className="notice notice-error"><span>{error}</span><button className="button button-outline" onClick={() => load(true)}>Try again</button></div> : loading ? <div className="page-loading"><span className="spinner" /> Loading your appointments…</div> : appointments.length === 0 ? <div className="panel patient-empty"><div className="empty-icon"><CalendarDays size={19} /></div><b>No appointments yet</b><span>Once you book a visit, its details and queue token will appear here.</span><Link className="button button-primary" to="/portal/book">Find a doctor <ArrowRight size={15} /></Link></div> : (
        <div className="patient-appointment-list">{appointments.map((appointment) => {
          const canCancel = appointment.status === "scheduled" && new Date(appointment.date).toISOString().slice(0, 10) >= todayISO();
          return <article className={`patient-appointment-card${appointment.status === "cancelled" ? " appointment-cancelled" : ""}`} key={appointment._id}>
            <div className="appointment-date-block"><span>{formatDate(appointment.date, { month: "short", timeZone: "UTC" }).toUpperCase()}</span><b>{new Date(appointment.date).getUTCDate()}</b><small>{displayTime(appointment.time)}</small></div>
            <div className="patient-appointment-main"><div className="patient-appointment-heading"><h3>Dr. {appointment.doctor?.name || "Care team"}</h3><span className={`status-tag status-${appointment.status}`}>{appointment.status.replace("-", " ")}</span></div><p>{appointment.doctor?.specialty} · {appointment.type}</p><div className="patient-appointment-meta"><span><CalendarDays size={14} />{formatDate(appointment.date, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</span>{appointment.doctor?.room && <span><MapPin size={14} />Room {appointment.doctor.room}</span>}</div>
              {appointment.status === "waiting" && <div className="queue-tracker"><span className="live-dot" /><div><b>{appointment.queuePosition === 1 ? "You’re next" : `${Math.max(0, (appointment.queuePosition || 1) - 1)} patient${appointment.queuePosition === 2 ? "" : "s"} ahead of you`}</b><small>Queue status updates automatically every 30 seconds.</small></div><TicketCheck size={18} /></div>}
              {appointment.status === "in-consultation" && <div className="queue-tracker in-consultation"><span className="consultation-pulse" /><div><b>Your consultation is in progress</b><small>Please remain nearby until your care team is ready.</small></div><TicketCheck size={18} /></div>}
            </div>
            <div className="patient-appointment-actions">{appointment.tokenNumber && <div className="appointment-token"><small>QUEUE TOKEN</small><b>#{appointment.tokenNumber}</b></div>}{canCancel && <button className="button button-outline" disabled={cancelling === appointment._id} onClick={() => cancel(appointment)}>{cancelling === appointment._id ? "Cancelling…" : "Cancel visit"}</button>}</div>
          </article>;
        })}</div>
      )}
      <div className="patient-care-note"><Clock3 size={16} /><span><b>Need help with a visit?</b> Please contact the care team if you need to change a visit that’s already in the queue.</span><Link to="/portal/book">Book another <ArrowRight size={14} /></Link></div>
    </div>
  );
}
