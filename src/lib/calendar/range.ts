// Cuentas de fechas del calendario. Todo son días (YYYY-MM-DD) de Argentina; las semanas empiezan en lunes.

import { addDays, formatShortDate } from "../dates";

export type CalendarView = "mes" | "semana";

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

function toDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** El lunes de la semana de un día. */
export function startOfWeek(iso: string): string {
  const sundayFirst = toDate(iso).getUTCDay(); // 0 = domingo
  return addDays(iso, -((sundayFirst + 6) % 7));
}

/** El día 1 del mes de un día. */
export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 8)}01`;
}

/** El día 1 del mes que está `months` meses después (o antes, si es negativo). */
export function addMonths(iso: string, months: number): string {
  const first = toDate(startOfMonth(iso));
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + months, 1)).toISOString().slice(0, 10);
}

/** Los 7 días (lunes a domingo) de la semana de un día. */
export function daysOfWeek(iso: string): string[] {
  const monday = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** El mes de un día, en semanas completas (lunes a domingo): incluye los días sueltos de los meses vecinos. */
export function monthWeeks(iso: string): string[][] {
  const first = startOfMonth(iso);
  const last = addDays(addMonths(first, 1), -1);
  const weeks: string[][] = [];
  for (let monday = startOfWeek(first); monday <= last; monday = addDays(monday, 7)) {
    weeks.push(daysOfWeek(monday));
  }
  return weeks;
}

/** Del primer al último día que se ven en pantalla (ambos incluidos). */
export function visibleRange(view: CalendarView, iso: string): { from: string; to: string } {
  if (view === "semana") {
    const days = daysOfWeek(iso);
    return { from: days[0], to: days[6] };
  }
  const weeks = monthWeeks(iso);
  return { from: weeks[0][0], to: weeks[weeks.length - 1][6] };
}

/** El día al que se llega al pasar al período siguiente (+1) o al anterior (−1). */
export function shiftPeriod(view: CalendarView, iso: string, direction: 1 | -1): string {
  return view === "semana" ? addDays(startOfWeek(iso), 7 * direction) : addMonths(iso, direction);
}

/** ¿Es un día del mismo mes que `anchor`? */
export function inSameMonth(day: string, anchor: string): boolean {
  return day.slice(0, 7) === anchor.slice(0, 7);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Septiembre 2026" o "21 – 27 de septiembre 2026", según la vista. */
export function periodLabel(view: CalendarView, iso: string): string {
  const format = (day: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-AR", { ...options, timeZone: "UTC" }).format(toDate(day));

  if (view === "mes") return capitalize(format(iso, { month: "long", year: "numeric" }).replace(" de ", " "));

  const [start, end] = [startOfWeek(iso), addDays(startOfWeek(iso), 6)];
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${Number(start.slice(8))} – ${Number(end.slice(8))} de ${format(end, { month: "long" })} ${end.slice(0, 4)}`;
  }
  const startYear = start.slice(0, 4) === end.slice(0, 4) ? "" : ` ${start.slice(0, 4)}`;
  return `${formatShortDate(start)}${startYear} – ${formatShortDate(end)} ${end.slice(0, 4)}`;
}
