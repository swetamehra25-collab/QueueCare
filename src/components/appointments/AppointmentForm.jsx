import { useState } from "react";
import { todayISO } from "../../utils/helpers";

export default function AppointmentForm({ patients, doctors, initialData, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    patient: initialData?.patient?._id || initialData?.patient || "",
    doctor: initialData?.doctor?._id || initialData?.doctor || "",
    date: initialData?.date ? new Date(initialData.date).toISOString().slice(0, 10) : todayISO(),
    time: initialData?.time || "09:00",
    type: initialData?.type || "General consultation",
    notes: initialData?.notes || "",
  });
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <label className="field-span">Patient<select name="patient" value={form.patient} onChange={update} required><option value="">Choose a patient</option>{patients.map((patient) => <option value={patient._id} key={patient._id}>{patient.fullName} · {patient.patientId}</option>)}</select></label>
      <label className="field-span">Doctor<select name="doctor" value={form.doctor} onChange={update} required><option value="">Choose a clinician</option>{doctors.filter((doctor) => doctor.status !== "On leave").map((doctor) => <option value={doctor._id} key={doctor._id}>Dr. {doctor.name} · {doctor.specialty}</option>)}</select></label>
      <label>Date<input type="date" name="date" min={todayISO()} value={form.date} onChange={update} required /></label>
      <label>Time<input type="time" name="time" value={form.time} onChange={update} required /></label>
      <label className="field-span">Visit type<select name="type" value={form.type} onChange={update}><option>General consultation</option><option>Follow-up</option><option>Annual check-up</option><option>Specialist consultation</option><option>Diagnostic review</option><option>Vaccination</option></select></label>
      <label className="field-span">Notes <span className="muted">(optional)</span><textarea rows="2" name="notes" value={form.notes} onChange={update} maxLength={500} placeholder="Anything the care team should know?" /></label>
      <div className="form-actions field-span"><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : initialData ? "Save changes" : "Book appointment"}</button></div>
    </form>
  );
}
