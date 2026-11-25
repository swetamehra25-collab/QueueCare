import { useEffect, useState } from "react";
import { AlertOctagon, Plus, Siren } from "lucide-react";
import Modal from "../components/common/Modal";
import EmergencyRequests from "../components/emergency/EmergencyRequests";
import { useToast } from "../context/ToastContext";
import { get, patch, post, remove } from "../services/api";

const blank = { patientName: "", location: "", condition: "", severity: "high" };
function EmergencyForm({ saving, onSave, onCancel }) {
  const [form, setForm] = useState(blank);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
    <label className="field-span">Patient name<input name="patientName" value={form.patientName} onChange={update} placeholder="Patient’s full name" required /></label>
    <label className="field-span">Where are they?<input name="location" value={form.location} onChange={update} placeholder="e.g. East wing, room 204" required /></label>
    <label className="field-span">What’s happening?<textarea name="condition" rows="3" value={form.condition} onChange={update} placeholder="Briefly describe the situation for the responding team" required /></label>
    <label className="field-span">Triage priority<select name="severity" value={form.severity} onChange={update}><option value="critical">Critical — immediate response</option><option value="high">High — urgent attention</option><option value="normal">Standard — prompt attention</option></select></label>
    <div className="form-actions field-span"><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button><button className="button button-danger" disabled={saving}><Siren size={16} />{saving ? "Logging…" : "Log emergency"}</button></div>
  </form>;
}

export default function Emergency() {
  const [requests, setRequests] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const notify = useToast();
  async function load() {
    try { setRequests((await get("/emergencies")).data); setError(""); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function create(data) {
    setSaving(true);
    try { await post("/emergencies", data); notify("Emergency request logged. The care team has been notified."); setOpen(false); await load(); }
    catch (requestError) { notify(requestError.message, "error"); }
    finally { setSaving(false); }
  }
  async function changeStatus(id, status) {
    try { await patch(`/emergencies/${id}/status`, { status }); notify("Emergency status updated."); await load(); }
    catch (requestError) { notify(requestError.message, "error"); }
  }
  async function deleteRequest(request) {
    if (!window.confirm(`Remove the request for ${request.patientName}?`)) return;
    try { await remove(`/emergencies/${request._id}`); notify("Emergency request removed."); await load(); }
    catch (requestError) { notify(requestError.message, "error"); }
  }
  const active = requests.filter((request) => request.status !== "resolved");
  return <div className="page emergency-page">
    <div className="page-intro-row"><div><span className="eyebrow">STAFF-COORDINATED RESPONSE</span><h2>Every second, handled together.</h2><p>Keep urgent requests visible, assigned, and moving toward resolution.</p></div><button className="button button-danger" onClick={() => setOpen(true)}><Plus size={17} /> New emergency</button></div>
    <div className="emergency-alert"><div className="emergency-alert-icon"><AlertOctagon size={20} /></div><div><b>{active.length} active {active.length === 1 ? "request" : "requests"}</b><span>Review each request and keep its status up to date.</span></div><span className="emergency-live"><i /> Live response desk</span></div>
    <section className="panel emergency-panel"><div className="panel-heading"><div><span className="eyebrow">RESPONSE DESK</span><h2>Emergency requests <span className="count-pill">{active.length}</span></h2></div><button className="text-button" onClick={load}>Refresh</button></div>
      {error ? <div className="inline-error">{error}<button onClick={load}>Retry</button></div> : loading ? <div className="page-loading"><span className="spinner" /> Loading emergency requests…</div> : <EmergencyRequests requests={requests} onStatusChange={changeStatus} onDelete={deleteRequest} />}
    </section>
    {open && <Modal title="Log an emergency" subtitle="This request will be visible to the entire staff team." onClose={() => setOpen(false)}><EmergencyForm saving={saving} onSave={create} onCancel={() => setOpen(false)} /></Modal>}
  </div>;
}
