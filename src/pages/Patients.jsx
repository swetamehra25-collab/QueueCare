import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Users, X } from "lucide-react";
import Modal from "../components/common/Modal";
import PatientForm from "../components/patients/PatientForm";
import PatientList from "../components/patients/PatientList";
import { useToast } from "../context/ToastContext";
import { get, post, put, remove } from "../services/api";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const notify = useToast();

  async function load() {
    try {
      const result = await get("/patients");
      setPatients(result.data);
      setTotalCount(result.totalCount ?? result.data.length);
      setError("");
    }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => patients.filter((patient) => [patient.fullName, patient.patientId, patient.phone, patient.email].join(" ").toLowerCase().includes(query.toLowerCase())), [patients, query]);
  function addPatient() { setEditing(null); setOpen(true); }
  function editPatient(patient) { setEditing(patient); setOpen(true); }
  async function savePatient(data) {
    setSaving(true);
    try {
      if (editing) await put(`/patients/${editing._id}`, data);
      else await post("/patients", data);
      notify(editing ? "Patient details updated." : "Patient added to your care list.");
      setOpen(false); await load();
    } catch (requestError) { notify(requestError.message, "error"); }
    finally { setSaving(false); }
  }
  async function deletePatient(patient) {
    if (!window.confirm(`Remove ${patient.fullName} from the patient list?`)) return;
    try { await remove(`/patients/${patient._id}`); notify("Patient removed."); await load(); }
    catch (requestError) { notify(requestError.message, "error"); }
  }

  return (
    <div className="page">
      <div className="page-intro-row"><div><span className="eyebrow">PATIENT DIRECTORY</span><h2>Every patient, thoughtfully cared for.</h2><p>Keep patient details close and their care journey connected.</p></div><button className="button button-primary" onClick={addPatient}><Plus size={17} /> Add patient</button></div>
      <div className="directory-summary"><div className="summary-icon"><Users size={20} /></div><div><b>{totalCount}</b><span> patients in your directory</span></div><span className="summary-note">Patient records are securely stored</span></div>
      <section className="panel directory-panel">
        <div className="directory-toolbar"><div><h2>Patient directory</h2><p>Search and manage patient profiles.</p></div><label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patients…" />{query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={15} /></button>}</label></div>
        {error ? <div className="inline-error">{error}<button onClick={load}>Retry</button></div> : loading ? <div className="page-loading"><span className="spinner" /> Loading patients…</div> : <PatientList patients={filtered} onEdit={editPatient} onDelete={deletePatient} />}
        <div className="table-foot">Showing <b>{filtered.length}</b> of <b>{totalCount}</b> patients{patients.length < totalCount ? " (first 500 loaded)" : ""}</div>
      </section>
      {open && <Modal title={editing ? "Update patient" : "Add a patient"} subtitle="A few details help us make every visit feel personal." onClose={() => setOpen(false)}><PatientForm key={editing?._id || "new"} initialData={editing} onSubmit={savePatient} onCancel={() => setOpen(false)} saving={saving} /></Modal>}
    </div>
  );
}
