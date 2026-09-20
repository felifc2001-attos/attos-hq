// Fechas "de calendario" (YYYY-MM-DD) en la zona horaria de ATTOS.
// Las tareas guardan solo el día (columna `date`), sin hora, así que se comparan como texto.

const TIME_ZONE = "America/Argentina/Buenos_Aires";

/** El día de hoy en Argentina, como YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUTC(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUTC(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Cantidad de días entre dos fechas (a − b). */
export function diffDays(a: string, b: string): number {
  return Math.round((toUTC(a) - toUTC(b)) / 86_400_000);
}

/** ¿Es una fecha YYYY-MM-DD que existe de verdad (no 2026-02-31)? */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(toUTC(value)).toISOString().slice(0, 10) === value;
}

/** El día (YYYY-MM-DD) en Argentina de un instante guardado en la base. */
export function dateInAR(timestamp: string): string {
  return todayISO(new Date(timestamp));
}

/** La hora ("10:30") en Argentina de un instante guardado en la base. */
export function timeInAR(timestamp: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TIME_ZONE,
  }).format(new Date(timestamp));
}

/** Instante exacto (ISO) de un día y hora de Argentina. Argentina no usa horario de verano: siempre UTC-3. */
export function arToISO(date: string, time = "00:00"): string {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

/** "Mié", "Jue"… */
export function formatWeekdayShort(iso: string): string {
  const label = new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: "UTC" })
    .format(new Date(toUTC(iso)))
    .replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "25 sep" */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(toUTC(iso)))
    .replace(".", "");
}

/** "ahora", "hace 5 min", "hace 2 h", "ayer", "hace 3 días", "25 sep". */
export function formatRelativeTime(timestamp: string, now: number = Date.now()): string {
  const minutes = Math.floor(Math.max(0, now - new Date(timestamp).getTime()) / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return formatShortDate(todayISO(new Date(timestamp)));
}

/** "Sábado 19 de septiembre" */
export function formatLongDate(iso: string): string {
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(toUTC(iso)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "Hoy", "Mañana", "Ayer", "Hace 3 días", "Jueves", "25 sep"… */
export function formatDueLabel(due: string, today: string): string {
  const diff = diffDays(due, today);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff < 0) return `Hace ${-diff} días`;

  const date = new Date(toUTC(due));
  if (diff < 7) {
    const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "UTC" }).format(date);
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }
  return formatShortDate(due);
}
