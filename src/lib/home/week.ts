import { dateInAR, timeInAR } from "../dates";
import type { Person } from "../tasks/types";

export interface WeekEvent {
  id: string;
  title: string;
  startsAt: string;
  allDay: boolean;
  person: Person | null;
}

export interface WeekTask {
  id: string;
  title: string;
  dueDate: string;
  person: Person | null;
}

export interface WeekItem {
  key: string;
  kind: "event" | "task";
  title: string;
  /** Día, YYYY-MM-DD (en Argentina). */
  date: string;
  /** "10:30", o null si es de todo el día o es una tarea. */
  time: string | null;
  person: Person | null;
}

/** Junta eventos del calendario y tareas con fecha en una sola lista, en orden cronológico. */
export function buildWeek(events: WeekEvent[], tasks: WeekTask[], limit = 8): WeekItem[] {
  const items: WeekItem[] = [
    ...events.map((event) => ({
      key: `event-${event.id}`,
      kind: "event" as const,
      title: event.title,
      date: dateInAR(event.startsAt),
      time: event.allDay ? null : timeInAR(event.startsAt),
      person: event.person,
    })),
    ...tasks.map((task) => ({
      key: `task-${task.id}`,
      kind: "task" as const,
      title: task.title,
      date: task.dueDate,
      time: null,
      person: task.person,
    })),
  ];

  return items
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time ?? "").localeCompare(b.time ?? "") ||
        a.title.localeCompare(b.title, "es"),
    )
    .slice(0, limit);
}
