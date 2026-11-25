import { Activity, CalendarCheck2, Clock3, UserRound, Users } from "lucide-react";

const cards = [
  { key: "totalPatients", label: "Registered patients", Icon: Users, tone: "mint", note: "In your patient directory" },
  { key: "patientsToday", label: "Patients today", Icon: UserRound, tone: "blue", note: "Checked in for care today" },
  { key: "totalAppointments", label: "Appointments", Icon: CalendarCheck2, tone: "blue", note: "Across the appointment schedule" },
  { key: "waiting", label: "In the queue", Icon: Clock3, tone: "amber", note: "Waiting to be seen" },
  { key: "avgWait", label: "Average wait", Icon: Activity, tone: "violet", note: "Across everyone currently waiting" },
];

export default function StatsCards({ stats = {} }) {
  return (
    <div className="stats-grid">
      {cards.map(({ key, label, Icon, tone, note }) => (
        <article className="stat-card" key={key}>
          <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{key === "avgWait" ? <>{stats[key] ?? 0}<small> min</small></> : (stats[key] ?? 0)}</div>
          <div className="stat-note">{note}</div>
        </article>
      ))}
    </div>
  );
}
