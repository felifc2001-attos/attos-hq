import { addDays } from "../dates";
import type { CalendarItem } from "./types";

const DAY_MS = 86_400_000;

/** Un instante corrido `days` días. Argentina no usa horario de verano: un día son siempre 24 horas, y la hora del evento no cambia. */
export function shiftTimestamp(timestamp: string, days: number): string {
  return new Date(new Date(timestamp).getTime() + days * DAY_MS).toISOString();
}

/** El mismo elemento corrido `days` días (para mostrar el movimiento al instante, antes de que responda el servidor). */
export function shiftItem(item: CalendarItem, days: number): CalendarItem {
  const moved: CalendarItem = { ...item, start: addDays(item.start, days), end: addDays(item.end, days) };
  if (item.event) {
    moved.event = {
      ...item.event,
      date: addDays(item.event.date, days),
      endDate: item.event.endDate ? addDays(item.event.endDate, days) : null,
    };
  }
  if (item.task?.dueDate) moved.task = { ...item.task, dueDate: addDays(item.task.dueDate, days) };
  if (item.content?.publishAt) moved.content = { ...item.content, publishAt: shiftTimestamp(item.content.publishAt, days) };
  return moved;
}
