import { useState } from "react";

const blankPatient = { fullName: "", email: "", phone: "", age: "", gender: "Female", bloodGroup: "", condition: "" };

export default function PatientForm({ initialData, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(initialData ? { ...blankPatient, ...initialData, age: initialData.age ?? "" } : blankPatient);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, age: Number(form.age) }); }}>
      <label className="field-span">Full name<input name="fullName" value={form.fullName} onChange={update} placeholder="e.g. Maya Bennett" required maxLength={100} /></label>
      <label>Email address<input name="email" type="email" value={form.email} onChange={update} placeholder="maya@email.com" /></label>
      <label>Phone number<input name="phone" type="tel" value={form.phone} onChange={update} placeholder="+1 (555) 000-0000" required /></label>
      <label>Age<input name="age" type="number" min="0" max="130" value={form.age} onChange={update} required /></label>
      <label>Gender<select name="gender" value={form.gender} onChange={update}><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></label>
      <label>Blood group<select name="bloodGroup" value={form.bloodGroup} onChange={update}><option value="">Not recorded</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field-span">Primary concern<input name="condition" value={form.condition} onChange={update} placeholder="e.g. Annual wellness visit" maxLength={200} /></label>
      <div className="form-actions field-span"><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : initialData ? "Save changes" : "Add patient"}</button></div>
    </form>
  );
}
