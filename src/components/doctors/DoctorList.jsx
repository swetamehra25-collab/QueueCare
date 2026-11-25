import { Mail, MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { initials } from "../../utils/helpers";

export default function DoctorList({ doctors, onEdit, onDelete }) {
  if (!doctors.length) return <div className="empty-state"><div className="empty-icon">✚</div><b>No clinicians yet</b><span>Add your first care team member to get started.</span></div>;
  return <div className="doctor-grid">{doctors.map((doctor, index) => <article className="doctor-card" key={doctor._id}>
    <div className="doctor-card-head"><div className={`doctor-avatar doctor-tone-${index % 5}`}>{initials(doctor.name)}</div><span className={`availability ${doctor.status === "Available" ? "available" : doctor.status === "On leave" ? "leave" : "busy"}`}><i />{doctor.status}</span><div className="doctor-actions"><button className="icon-button" aria-label={`Edit Dr. ${doctor.name}`} onClick={() => onEdit(doctor)}><Pencil size={15} /></button><button className="icon-button danger-hover" aria-label={`Remove Dr. ${doctor.name}`} onClick={() => onDelete(doctor)}><Trash2 size={15} /></button></div></div>
    <h3>Dr. {doctor.name}</h3><span className="doctor-specialty">{doctor.specialty}</span><div className="doctor-department">{doctor.department || "General medicine"}</div>
    <div className="doctor-meta"><span><MapPin size={14} /> Room {doctor.room || "—"}</span><span><Phone size={14} /> {doctor.phone || "—"}</span></div>
    <a className="doctor-email" href={`mailto:${doctor.email}`}><Mail size={14} />{doctor.email}</a>
  </article>)}</div>;
}
