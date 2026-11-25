import { Pencil, Trash2 } from "lucide-react";
import { formatDate, initials } from "../../utils/helpers";

export default function PatientList({ patients, onEdit, onDelete }) {
  if (!patients.length) return <div className="empty-state"><div className="empty-icon">♡</div><b>No patients found</b><span>Try another search, or add your first patient.</span></div>;
  return (
    <div className="table-scroll"><table className="data-table"><thead><tr><th>Patient</th><th>Patient ID</th><th>Phone</th><th>Age / Gender</th><th>Blood group</th><th>Last updated</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
      {patients.map((patient, index) => <tr key={patient._id}><td><div className="table-person"><div className={`avatar avatar-tone-${index % 5}`}>{initials(patient.fullName)}</div><div><b>{patient.fullName}</b><small>{patient.email || "No email provided"}</small></div></div></td><td><span className="id-code">{patient.patientId}</span></td><td>{patient.phone}</td><td>{patient.age} <span className="muted">/ {patient.gender}</span></td><td>{patient.bloodGroup || "—"}</td><td>{formatDate(patient.updatedAt || patient.createdAt, { month: "short", day: "numeric" })}</td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${patient.fullName}`} onClick={() => onEdit(patient)}><Pencil size={15} /></button><button className="icon-button danger-hover" aria-label={`Delete ${patient.fullName}`} onClick={() => onDelete(patient)}><Trash2 size={15} /></button></div></td></tr>)}
    </tbody></table></div>
  );
}
