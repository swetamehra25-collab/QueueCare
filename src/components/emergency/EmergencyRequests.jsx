import { AlertTriangle, ArrowUpRight, Check, Clock3, MapPin, Trash2 } from "lucide-react";
import { formatDate, initials } from "../../utils/helpers";

export default function EmergencyRequests({ requests, onStatusChange, onDelete }) {
  if (!requests.length) return <div className="empty-state"><div className="empty-icon">♡</div><b>No active emergencies</b><span>New requests will appear here for the team to coordinate.</span></div>;
  return <div className="emergency-list">{requests.map((request) => <article className={`emergency-card severity-${request.severity}`} key={request._id}>
    <div className="emergency-severity"><AlertTriangle size={17} /><span>{request.severity} priority</span></div>
    <div className="emergency-patient"><div className="avatar">{initials(request.patientName)}</div><div><h3>{request.patientName}</h3><span>{request.condition}</span></div></div>
    <div className="emergency-details"><span><MapPin size={15} />{request.location}</span><span><Clock3 size={15} />{formatDate(request.createdAt, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}</span><span>Logged by {request.requestedBy?.name || "Care staff"}</span></div>
    <div className="emergency-controls"><label className={`status-select status-${request.status}`}><select value={request.status} onChange={(event) => onStatusChange(request._id, event.target.value)} aria-label={`Update emergency status for ${request.patientName}`}><option value="new">New request</option><option value="responding">Responding</option><option value="resolved">Resolved</option></select></label><button className="button button-outline emergency-delete" onClick={() => onDelete(request)}><Trash2 size={15} /> Remove</button></div>
  </article>)}</div>;
}
