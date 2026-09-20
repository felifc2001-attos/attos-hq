import type { Area, Priority, TaskStatus } from "./constants";

export interface Person {
  id: string;
  fullName: string;
  /** Color identificador en hexadecimal. */
  color: string;
}

/** Persona tal como se ofrece en los desplegables (con el área que se sugiere al crear tareas). */
export interface PersonOption extends Person {
  defaultArea: Area | null;
}

export interface ProjectOption {
  id: string;
  name: string;
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

/** Algo que esta tarea está esperando ("Necesito de…" pendiente). */
export interface BlockedBy {
  title: string;
  providerName: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  area: Area | null;
  /** Solo el día, YYYY-MM-DD. */
  dueDate: string | null;
  completedAt: string | null;
  /** Orden dentro de su columna del Kanban (menor = más arriba). */
  position: number;
  assigneeId: string | null;
  creatorId: string | null;
  projectId: string | null;
  assignee: Person | null;
  project: ProjectOption | null;
  labels: TaskLabel[];
  blockedBy: BlockedBy[];
}

export interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  author: Person | null;
  /** ¿Lo escribí yo? (solo los propios se pueden borrar). */
  mine: boolean;
}

/** Lo que se envía desde el formulario al crear o editar una tarea. */
export interface TaskInput {
  title: string;
  description: string;
  assigneeId: string | null;
  area: Area | null;
  projectId: string | null;
  dueDate: string | null;
  priority: Priority;
  status: TaskStatus;
}

/** Todo lo que necesita el formulario de tareas para armar sus desplegables. */
export interface TaskFormOptions {
  meId: string;
  /** Área que se sugiere al crear una tarea nueva (la habitual de quien la crea). */
  defaultArea: Area | null;
  people: PersonOption[];
  projects: ProjectOption[];
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CommentsResult = { ok: true; comments: CommentItem[] } | { ok: false; error: string };
export type AddCommentResult = { ok: true; comment: CommentItem } | { ok: false; error: string };
