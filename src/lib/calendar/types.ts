import type { ContentItem } from "../content/types";
import type { EventCategory, EventKind } from "../quick-create/constants";
import type { Person, Task } from "../tasks/types";

export type CalendarKind = "event" | "task" | "content";

/** Un evento del calendario tal como lo edita el formulario (día y horas de Argentina). */
export interface EditableEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  kind: EventKind;
  /** Día de inicio, YYYY-MM-DD. */
  date: string;
  allDay: boolean;
  /** "HH:MM". En los eventos de todo el día es solo el valor de partida si se pasan a tener hora. */
  startTime: string;
  /** "HH:MM" del mismo día; solo en eventos con hora. */
  endTime: string | null;
  /** Último día, si un evento de todo el día dura varios. */
  endDate: string | null;
  projectId: string | null;
}

/** Una fila de `calendar_events` con quien lo creó. */
export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  project_id: string | null;
  creator: { id: string; full_name: string; color: string } | null;
}

/** Cualquier cosa que se dibuja en el calendario: un evento, una tarea con fecha o una publicación. */
export interface CalendarItem {
  /** Único en todo el calendario: "event-<id>", "task-<id>" o "content-<id>". */
  key: string;
  kind: CalendarKind;
  id: string;
  title: string;
  /** Primer y último día que ocupa, YYYY-MM-DD (iguales si dura un solo día). */
  start: string;
  end: string;
  /** "10:30"; null si es de todo el día, una tarea o no tiene hora. */
  time: string | null;
  /** Define el color. Las tareas sin área no tienen. */
  category: EventCategory | null;
  /** Tarea lista o publicación ya publicada: se ve apagada. */
  done: boolean;
  person: Person | null;
  /** "Reunión", "Tarea", "Post"… */
  label: string;
  /** ¿Se puede arrastrar a otro día? Las tareas, los eventos y las publicaciones sí. */
  movable: boolean;
  event?: EditableEvent;
  task?: Task;
  content?: ContentItem;
}
