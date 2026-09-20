import { dateInAR, timeInAR } from "../dates";
import { CONTENT_FORMATS, labelOf } from "../content/constants";
import type { ContentItem } from "../content/types";
import { EVENT_KINDS, type EventCategory } from "../quick-create/constants";
import type { Task } from "../tasks/types";
import type { CalendarItem, EditableEvent, EventRow } from "./types";

const toPerson = (row: { id: string; full_name: string; color: string } | null) =>
  row ? { id: row.id, fullName: row.full_name, color: row.color } : null;

/** El evento como lo edita el formulario: día y horas de Argentina. */
export function toEditableEvent(row: EventRow): EditableEvent {
  const date = dateInAR(row.starts_at);
  const endDay = row.ends_at ? dateInAR(row.ends_at) : null;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    kind: row.kind,
    date,
    allDay: row.all_day,
    startTime: row.all_day ? "10:00" : timeInAR(row.starts_at),
    // El formulario solo maneja una hora de fin del mismo día.
    endTime: !row.all_day && row.ends_at && endDay === date ? timeInAR(row.ends_at) : null,
    endDate: row.all_day && endDay && endDay > date ? endDay : null,
    projectId: row.project_id,
  };
}

export function eventToItem(row: EventRow): CalendarItem {
  const event = toEditableEvent(row);
  return {
    key: `event-${row.id}`,
    kind: "event",
    id: row.id,
    title: row.title,
    start: event.date,
    end: event.endDate ?? event.date,
    time: row.all_day ? null : timeInAR(row.starts_at),
    category: row.category,
    done: false,
    person: toPerson(row.creator),
    label: labelOf(EVENT_KINDS, row.kind),
    movable: true,
    event,
  };
}

/** Una tarea con fecha límite; sin fecha no tiene lugar en el calendario. */
export function taskToItem(task: Task): CalendarItem | null {
  if (!task.dueDate) return null;
  return {
    key: `task-${task.id}`,
    kind: "task",
    id: task.id,
    title: task.title,
    start: task.dueDate,
    end: task.dueDate,
    time: null,
    category: task.area,
    done: task.status === "listo",
    person: task.assignee,
    label: "Tarea",
    movable: true,
    task,
  };
}

/** Una publicación con fecha; sin fecha no tiene lugar en el calendario. */
export function contentToItem(content: ContentItem): CalendarItem | null {
  if (!content.publishAt) return null;
  const day = dateInAR(content.publishAt);
  return {
    key: `content-${content.id}`,
    kind: "content",
    id: content.id,
    title: content.title,
    start: day,
    end: day,
    time: timeInAR(content.publishAt),
    category: "marketing",
    done: content.status === "publicado",
    person: content.assignee,
    label: `Publicación · ${labelOf(CONTENT_FORMATS, content.format)}`,
    movable: true,
    content,
  };
}

const KIND_RANK = { event: 0, content: 1, task: 2 } as const;

/** Orden dentro de un día: primero lo que no tiene hora (eventos de todo el día, tareas), después lo demás por hora. */
export function compareItems(a: CalendarItem, b: CalendarItem): number {
  return (
    Number(a.time !== null) - Number(b.time !== null) ||
    (a.time ?? "").localeCompare(b.time ?? "") ||
    KIND_RANK[a.kind] - KIND_RANK[b.kind] ||
    a.title.localeCompare(b.title, "es")
  );
}

/** Los elementos de cada día. Uno que dura varios días aparece en todos los que ocupa. */
export function itemsByDay(items: CalendarItem[], days: string[]): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  for (const day of days) {
    map.set(day, items.filter((item) => item.start <= day && day <= item.end).sort(compareItems));
  }
  return map;
}

export const CALENDAR_TYPES = [
  { value: "eventos", label: "Eventos", kind: "event" },
  { value: "tareas", label: "Tareas", kind: "task" },
  { value: "publicaciones", label: "Publicaciones", kind: "content" },
] as const;

export type CalendarType = (typeof CALENDAR_TYPES)[number]["value"];

/** Qué mostrar: un solo tipo y/o una sola categoría (null = todo). */
export function applyCalendarFilters(
  items: CalendarItem[],
  filters: { type: CalendarType | null; category: EventCategory | null },
): CalendarItem[] {
  const kind = CALENDAR_TYPES.find((option) => option.value === filters.type)?.kind;
  return items.filter(
    (item) => (!kind || item.kind === kind) && (!filters.category || item.category === filters.category),
  );
}
