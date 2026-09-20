import type { Area, Priority } from "../tasks/constants";
import type { PersonOption, ProjectOption } from "../tasks/types";
import type { EventCategory, EventKind, IssueCategory, ProjectStatus } from "./constants";

/** Lo que se envía desde cada formulario. Se vuelve a revisar en el servidor. */

export interface IdeaInput {
  title: string;
  description: string;
  area: Area | null;
}

export interface IssueInput {
  title: string;
  description: string;
  steps: string;
  category: IssueCategory;
  priority: Priority;
  assigneeId: string | null;
}

export interface EventInput {
  title: string;
  description: string;
  category: EventCategory;
  kind: EventKind;
  /** Día de inicio, YYYY-MM-DD. */
  date: string;
  allDay: boolean;
  /** "HH:MM"; solo si no es de todo el día. */
  startTime: string;
  /** "HH:MM"; opcional, el mismo día. Solo si no es de todo el día. */
  endTime: string | null;
  /** Último día, para eventos de todo el día que duran varios. */
  endDate: string | null;
  projectId: string | null;
}

export interface ProjectInput {
  name: string;
  description: string;
  ownerId: string | null;
  status: ProjectStatus;
  startDate: string | null;
  targetDate: string | null;
  memberIds: string[];
}

export interface DependencyInput {
  providerId: string;
  title: string;
  description: string;
  dueDate: string | null;
  /** Tarea mía que queda bloqueada hasta que me lo entreguen. */
  taskId: string | null;
  projectId: string | null;
}

export interface OpenTaskOption {
  id: string;
  title: string;
}

/** Desplegables de los formularios; se piden al abrir cada uno para que estén al día. */
export interface CreateOptions {
  meId: string;
  defaultArea: Area | null;
  people: PersonOption[];
  projects: ProjectOption[];
  /** Mis tareas sin terminar (para "esto bloquea mi tarea…"). */
  myTasks: OpenTaskOption[];
}
