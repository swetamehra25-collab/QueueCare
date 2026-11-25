export function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", options).format(new Date(value));
}

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function displayTime(value) {
  if (!value) return "—";
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}
