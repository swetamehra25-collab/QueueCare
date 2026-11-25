import { ArrowRight, ArrowUpRight, CircleCheck, Clock3, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { displayTime, initials } from "../../utils/helpers";

export default function QueueOverview({ queue = [], totalWaiting = queue.length, onComplete }) {
  return (
    <section className="panel queue-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">LIVE QUEUE</span><h2>Patients waiting <span className="count-pill">{totalWaiting}</span></h2></div>
        <Link className="text-link" to="/appointments">View all <ArrowRight size={15} /></Link>
      </div>
      {queue.length === 0 ? <div className="empty-state compact-empty"><CircleCheck size={24} /><b>All caught up</b><span>There are no patients waiting right now.</span></div> : (
        <div className="queue-list">
          {queue.slice(0, 5).map((appointment, index) => {
            const patient = appointment.patient || {};
            const doctor = appointment.doctor || {};
            return (
              <div className="queue-row" key={appointment._id}>
                <span className={`token-badge token-${index % 4}`}>#{appointment.tokenNumber || "—"}</span>
                <div className="avatar">{initials(patient.fullName || "Patient")}</div>
                <div className="queue-person"><b>{patient.fullName || "Patient"}</b><span>{appointment.type || "General consultation"}</span></div>
                <div className="queue-doctor"><span>With</span><b>{doctor.name || "Unassigned"}</b></div>
                <div className="queue-time"><Clock3 size={14} /> {displayTime(appointment.time)}</div>
                <button className="icon-button queue-more" aria-label={`Complete ${patient.fullName || "patient"} visit`} title="Mark as complete" onClick={() => onComplete(appointment._id)}><MoreHorizontal size={19} /><span className="sr-only">Complete</span></button>
              </div>
            );
          })}
        </div>
      )}
      <div className="queue-footer"><span><i className="live-dot" /> Queue updates in real time</span><Link to="/appointments">Open queue <ArrowUpRight size={14} /></Link></div>
    </section>
  );
}
