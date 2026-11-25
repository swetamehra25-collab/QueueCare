import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Search } from "lucide-react";
import Modal from "../components/common/Modal";
import AppointmentForm from "../components/appointments/AppointmentForm";
import AppointmentList from "../components/appointments/AppointmentList";
import { useToast } from "../context/ToastContext";
import { get, patch, post, put, remove } from "../services/api";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const notify = useToast();

  async function load() {
    try {
      const [appointmentResult, patientResult, doctorResult] = await Promise.all([get("/appointments"), get("/patients"), get("/doctors")]);
      setAppointments(appointmentResult.data); setTotalCount(appointmentResult.totalCount ?? appointmentResult.data.length); setPatients(patientResult.data); setDoctors(doctorResult.data); setError("");
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => appointments.filter((item) => (filter === "all" || item.status === filter) && `${item.patient?.fullName || ""} ${item.doctor?.name || ""} ${item.type}`.toLowerCase().includes(query.toLowerCase())), [appointments, filter, query]);
  async function save(data) {
    setSaving(true);
    try {
      if (editing) await put(`/appointments/${editing._id}`, data);
      else await post("/appointments", data);
      notify(editing ? "Appointment updated." : "Appointment booked and added to the queue.");
      setOpen(false); await load();
    } catch (requestError) { notify(requestError.message, "error"); }
    finally { setSaving(false); }
  }
  async function changeStatus(id, status) {
    try { await patch(`/appointments/${id}/status`, { status }); notify("Appointment status updated."); await load(); }
    catch (requestError) { notify(requestError.message, "error"); }
  }
  async function deleteItem(item) {
    if (!window.confirm(`Delete the appointment for ${item.patient?.fullName || "this patient"}?`)) return;
    try { await remove(`/appointments/${item._id}`); notify("Appointment deleted."); await load(); }
    catch (requestError) { notify(requestError.message, "error"); }
  }

  const filters = [["all", "All"], ["scheduled", "Scheduled"], ["waiting", "Waiting"], ["in-consultation", "In consultation"], ["completed", "Completed"]];
  return (
    <div className="page">
      <div className="page-intro-row"><div><span className="eyebrow">VISIT SCHEDULE</span><h2>Make room for good care.</h2><p>Appointments, queues, and the next step for every visit.</p></div><button className="button button-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={17} /> Book appointment</button></div>
      <div className="appointment-overview">
        <div className="appointment-overview-icon"><CalendarDays size={20} /></div><div><b>{totalCount}</b><span> appointments in the schedule</span></div>
        <div className="overview-divider" /><div className="overview-mini"><span className="live-dot" /> <b>{appointments.filter((a) => ["waiting", "in-consultation"].includes(a.status)).length}</b><span> active in queue</span></div>
      </div>
      <section className="panel directory-panel">
        <div className="directory-toolbar appointment-toolbar"><div><h2>Appointment list</h2><p>Every visit, at every stage of care.</p></div><label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search visits…" /></label></div>
        <div className="filter-tabs" role="tablist" aria-label="Filter appointments">{filters.map(([value, label]) => <button key={value} className={filter === value ? "selected" : ""} onClick={() => setFilter(value)}>{label}{value === "waiting" && <span>{appointments.filter((item) => item.status === value).length}</span>}</button>)}</div>
        {error ? <div className="inline-error">{error}<button onClick={load}>Retry</button></div> : loading ? <div className="page-loading"><span className="spinner" /> Loading appointments…</div> : <AppointmentList appointments={filtered} onEdit={(item) => { setEditing(item); setOpen(true); }} onDelete={deleteItem} onStatusChange={changeStatus} />}
        <div className="table-foot">Showing <b>{filtered.length}</b> of <b>{totalCount}</b> visits{appointments.length < totalCount ? " (first 500 loaded)" : ""}</div>
      </section>
      {open && <Modal title={editing ? "Update appointment" : "Book an appointment"} subtitle="Let’s find the right time and clinician." onClose={() => setOpen(false)}><AppointmentForm key={editing?._id || "new"} patients={patients} doctors={doctors} initialData={editing} onSubmit={save} onCancel={() => setOpen(false)} saving={saving} /></Modal>}
    </div>
  );
}
