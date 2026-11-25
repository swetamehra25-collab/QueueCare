import { Pencil, Trash2 } from "lucide-react";
import { displayTime, formatDate, initials } from "../../utils/helpers";

const statuses = ["scheduled", "waiting", "in-consultation", "completed", "cancelled"];

export default function AppointmentList({ appointments, onEdit, onDelete, onStatusChange }) {
  if (!appointments.length) return <div className="empty-state"><div className="empty-icon">◷</div><b>No appointments here</b><span>Appointments will show up here once they’re booked.</span></div>;
  return (
    <div className="table-scroll"><table className="data-table appointment-table"><thead><tr><th>Patient</th><th>Clinician</th><th>Date & time</th><th>Visit type</th><th>Token</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
      {appointments.map((appointment, index) => <tr key={appointment._id}><td><div className="table-person"><div className={`avatar avatar-tone-${index % 5}`}>{initials(appointment.patient?.fullName || "Patient")}</div><div><b>{appointment.patient?.fullName || "Patient"}</b><small>{appointment.patient?.patientId || "—"}</small></div></div></td><td><div className="doctor-cell"><b>Dr. {appointment.doctor?.name || "Unassigned"}</b><small>{appointment.doctor?.specialty || "—"}</small></div></td><td><b>{formatDate(appointment.date, { month: "short", day: "numeric" })}</b><small className="cell-sub">{displayTime(appointment.time)}</small></td><td>{appointment.type}</td><td><span className="token-badge token-0">#{appointment.tokenNumber || "—"}</span></td><td><select className={`status-select status-${appointment.status}`} value={appointment.status} onChange={(event) => onStatusChange(appointment._id, event.target.value)} aria-label={`Change status for ${appointment.patient?.fullName || "appointment"}`}>{statuses.map((status) => <option key={status} value={status}>{status.replace("-", " ")}</option>)}</select></td><td><div className="row-actions"><button className="icon-button" aria-label="Edit appointment" onClick={() => onEdit(appointment)}><Pencil size={15} /></button><button className="icon-button danger-hover" aria-label="Delete appointment" onClick={() => onDelete(appointment)}><Trash2 size={15} /></button></div></td></tr>)}
    </tbody></table></div>
  );
}
