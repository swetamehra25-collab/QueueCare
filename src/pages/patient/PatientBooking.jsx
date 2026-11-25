import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock3, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { get, post } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { todayISO } from "../../utils/helpers";

const visitTypes = ["General consultation", "Follow-up", "Annual check-up", "Specialist consultation", "Diagnostic review", "Vaccination"];

export default function PatientBooking() {
  const navigate = useNavigate();
  const notify = useToast();
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [type, setType] = useState(visitTypes[0]);
  const [slots, setSlots] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [slotError, setSlotError] = useState("");

  useEffect(() => {
    get("/portal/doctors")
      .then(({ data }) => {
        setDoctors(data);
        setDoctorId(data.find((doctor) => doctor.status !== "On leave")?._id || "");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoadingDoctors(false));
  }, []);

  useEffect(() => {
    if (!doctorId || !date) { setSlots([]); setTime(""); return undefined; }
    let active = true;
    setLoadingSlots(true);
    setSlotError("");
    setTime("");
    get(`/portal/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`)
      .then(({ data }) => { if (active) setSlots(data); })
      .catch((requestError) => { if (active) { setSlots([]); setSlotError(requestError.message); } })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [doctorId, date]);

  async function book(event) {
    event.preventDefault();
    setBooking(true);
    try {
      const { data, emailSent } = await post("/portal/appointments", { doctor: doctorId, date, time, type });
      notify(emailSent
        ? "Appointment confirmed. A confirmation email was sent to your registered email."
        : "Appointment confirmed, but the email could not be sent. Please check with the care team.", emailSent ? "success" : "error");
      navigate("/portal/appointments", { state: { confirmed: data } });
    } catch (requestError) {
      notify(requestError.message, "error");
      if (requestError.message.toLowerCase().includes("slot")) {
        setTime("");
        setSlotError("That slot was just booked. Choose another available time.");
        try {
          const { data } = await get(`/portal/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
          setSlots(data);
          setSlotError("");
        } catch (refreshError) {
          setSlots([]);
          setSlotError(`Could not refresh available times. ${refreshError.message}`);
        }
      }
    } finally {
      setBooking(false);
    }
  }

  const selectedDoctor = doctors.find((doctor) => doctor._id === doctorId);
  return (
    <div className="patient-page">
      <div className="patient-page-intro"><span className="eyebrow">APPOINTMENT BOOKING</span><h2>Find time for your health.</h2><p>Choose your clinician and a time that works for you.</p></div>
      {error ? <div className="notice notice-error"><span>{error}</span></div> : loadingDoctors ? <div className="page-loading"><span className="spinner" /> Finding your care team…</div> : doctors.length === 0 ? <div className="panel patient-empty"><div className="empty-icon"><Stethoscope size={19} /></div><b>No clinicians are listed yet</b><span>Please contact the care team for help scheduling.</span></div> : (
        <form className="patient-booking-layout" onSubmit={book}>
          <section className="panel patient-booking-panel">
            <div className="patient-section-heading"><span className="patient-step">1</span><div><h3>Choose your clinician</h3><p>Pick a doctor for your visit.</p></div></div>
            <div className="patient-doctor-options">
              {doctors.map((doctor) => <button type="button" key={doctor._id} disabled={doctor.status === "On leave"} className={`patient-doctor-option${doctorId === doctor._id ? " selected" : ""}`} onClick={() => setDoctorId(doctor._id)}>
                <span className="patient-doctor-avatar">{doctor.name[0]}</span><span className="patient-doctor-copy"><b>Dr. {doctor.name}</b><small>{doctor.specialty}{doctor.department ? ` · ${doctor.department}` : ""}</small>{doctor.room && <small>Room {doctor.room}</small>}</span><span className={`availability ${doctor.status === "Available" ? "available" : doctor.status === "On leave" ? "leave" : "busy"}`}><i />{doctor.status}</span>{doctorId === doctor._id && <Check size={16} className="doctor-selected-check" />}
              </button>)}
            </div>
            <div className="patient-section-heading patient-step-two"><span className="patient-step">2</span><div><h3>Pick a date & time</h3><p>Appointments are available Monday to Friday, 9 AM–5 PM.</p></div></div>
            <label className="patient-date-field">Appointment date<span className="patient-input-icon"><CalendarDays size={16} /><input type="date" min={todayISO()} value={date} onChange={(event) => setDate(event.target.value)} required /></span></label>
            <div className="patient-slots-label"><span>Available time slots</span>{loadingSlots && <small><span className="spinner" /> Checking…</small>}</div>
            {slotError ? <div className="inline-error">{slotError}</div> : loadingSlots ? <div className="patient-slot-loading">Finding open times…</div> : slots.length ? <div className="patient-slot-grid">{slots.map((slot) => <button type="button" key={slot} className={`patient-time-slot${time === slot ? " selected" : ""}`} onClick={() => setTime(slot)}><Clock3 size={13} />{new Date(`2000-01-01T${slot}:00`).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}</button>)}</div> : <div className="patient-no-slots">{date && (new Date(`${date}T00:00:00`).getDay() === 0 || new Date(`${date}T00:00:00`).getDay() === 6) ? "We don’t schedule visits on weekends. Please choose a weekday." : "No available times on this date. Try another day."}</div>}
          </section>
          <aside className="panel patient-booking-summary">
            <div className="patient-section-heading"><span className="patient-step"><Stethoscope size={15} /></span><div><h3>Your visit</h3><p>Review the appointment details.</p></div></div>
            <label>Visit type<select value={type} onChange={(event) => setType(event.target.value)}>{visitTypes.map((visitType) => <option key={visitType}>{visitType}</option>)}</select></label>
            <div className="booking-summary-detail"><span>Clinician</span><b>{selectedDoctor ? `Dr. ${selectedDoctor.name}` : "Choose a doctor"}</b><small>{selectedDoctor?.specialty || "—"}</small></div>
            <div className="booking-summary-detail"><span>Date</span><b>{date ? new Date(`${date}T12:00:00.000Z`).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Choose a date"}</b></div>
            <div className="booking-summary-detail"><span>Time</span><b>{time ? new Date(`2000-01-01T${time}:00`).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }) : "Choose a time"}</b></div>
            <div className="booking-token-note"><Clock3 size={15} /><span>Your queue token will be generated when you confirm your booking.</span></div>
            <button className="button button-primary patient-confirm-button" disabled={!doctorId || !time || booking}>{booking ? "Confirming…" : "Confirm appointment"} <ArrowRight size={16} /></button>
            <small className="patient-cancel-note">Need to change plans? You can cancel future scheduled visits from your appointments.</small>
          </aside>
        </form>
      )}
    </div>
  );
}
