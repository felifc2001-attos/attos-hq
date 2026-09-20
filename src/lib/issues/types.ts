import type { Priority } from "../tasks/constants";
import type { IssueCategory } from "../quick-create/constants";
import type { Person } from "../tasks/types";
import type { IssueStatus } from "./constants";

/** Un problema o mejora del sistema con todo lo que muestran el tablero y su ficha. */
export interface IssueItem {
  id: string;
  title: string;
  description: string | null;
  category: IssueCategory;
  priority: Priority;
  status: IssueStatus;
  /** Orden dentro de su columna (menor = más arriba). */
  position: number;
  steps: string | null;
  reporterId: string | null;
  /** Vacío = está en la bandeja de Sistemas, esperando que alguien lo tome. */
  assigneeId: string | null;
  reporter: Person | null;
  assignee: Person | null;
  resolvedAt: string | null;
  createdAt: string;
}

/** Lo que se envía desde el formulario al editar un problema. */
export interface IssueEditInput {
  title: string;
  description: string;
  steps: string;
  category: IssueCategory;
  priority: Priority;
  status: IssueStatus;
  assigneeId: string | null;
}
