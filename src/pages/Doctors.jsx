import { useEffect, useState } from "react";
import { Plus, Stethoscope } from "lucide-react";
import Modal from "../components/common/Modal";
import DoctorList from "../components/doctors/DoctorList";
import { useToast } from "../context/ToastContext";
import { get, post, put, remove } from "../services/api";

const emptyDoctor = { name: "", specialty: "", department: "", email: "", phone: "", room: "", status: "Available" };

function DoctorForm({ doctor, saving, onSave, onCancel }) {
  const [form, setForm] = useState(doctor ? { ...emptyDoctor, ...doctor } : emptyDoctor);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
    <label className="field-span">Clinician name<input name="name" value={form.name} onChange={update} placeholder="e.g. Maya Chen" required /></label>
    <label>Specialty<input name="specialty" value={form.specialty} onChange={update} placeholder="Cardiology" required /></label>
    <label>Department<input name="department" value={form.department} onChange={update} placeholder="Heart & vascular" /></label>
    <label>Email<input type="email" name="email" value={form.email} onChange={update} /></label>
    <label>Phone<input type="tel" name="phone" value={form.phone} onChange={update} /></label>
    <label>Room<input name="room" value={form.room} onChange={update} placeholder="204" /></label>
    <label>Availability<select name="status" value={form.status} onChange={update}><option>Available</option><option>In consultation</option><option>On leave</option></select></label>
    <div className="form-actions field-span"><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : doctor ? "Save changes" : "Add clinician"}</button></div>
  </form>;
}

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const notify = useToast();
  async function load() {
    try { setDoctors((await get("/doctors")).data); setError(""); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function save(data) {
    setSaving(true);
    try { if (selected) await put(`/doctors/${selected._id}`, data); else await post("/doctors", data); notify(selected ? "Clinician details updated." : "Clinician added to the care team."); setOpen(false); await load(); }
    catch (requestError) { notify(requestError.message, "error"); }
    finally { setSaving(false); }
  }
  async function deleteDoctor(doctor) {
    if (!window.confirm(`Remove Dr. ${doctor.name} from the care team?`)) return;
    try { await remove(`/doctors/${doctor._id}`); notify("Clinician removed."); await load(); }
    catch (requestError) { notify(requestError.message, "error"); }
  }
  return <div className="page">
    <div className="page-intro-row"><div><span className="eyebrow">YOUR CLINICIANS</span><h2>Care is a team effort.</h2><p>Meet the people making every patient’s day a little better.</p></div><button className="button button-primary" onClick={() => { setSelected(null); setOpen(true); }}><Plus size={17} /> Add clinician</button></div>
    <div className="directory-summary"><div className="summary-icon summary-blue"><Stethoscope size={20} /></div><div><b>{doctors.length}</b><span> clinicians on your team</span></div><span className="summary-note">{doctors.filter((doctor) => doctor.status === "Available").length} available today</span></div>
    {error ? <div className="notice notice-error"><span>{error}</span><button className="button button-outline" onClick={load}>Try again</button></div> : loading ? <div className="page-loading"><span className="spinner" /> Loading your care team…</div> : <DoctorList doctors={doctors} onEdit={(doctor) => { setSelected(doctor); setOpen(true); }} onDelete={deleteDoctor} />}
    {open && <Modal title={selected ? "Update clinician" : "Add to the care team"} subtitle="Let your patients know who’s here to help." onClose={() => setOpen(false)}><DoctorForm key={selected?._id || "new"} doctor={selected} saving={saving} onSave={save} onCancel={() => setOpen(false)} /></Modal>}
  </div>;
}
