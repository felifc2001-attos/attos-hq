import type { Person, ProjectOption } from "../tasks/types";
import type { ContentFormat, ContentStatus, ReviewStatus } from "./constants";

/** Una publicación de marketing con todo lo que muestran el tablero y su ficha. */
export interface ContentItem {
  id: string;
  title: string;
  format: ContentFormat;
  status: ContentStatus;
  /** Orden dentro de su columna (menor = más arriba). */
  position: number;
  /** Cuándo sale, como instante exacto; null si todavía no tiene fecha. */
  publishAt: string | null;
  copy: string | null;
  links: string[];
  reviewStatus: ReviewStatus;
  /** Quién aprobó o pidió cambios. */
  reviewer: Person | null;
  reviewedAt: string | null;
  assigneeId: string | null;
  creatorId: string | null;
  projectId: string | null;
  assignee: Person | null;
  project: ProjectOption | null;
  createdAt: string;
}

/** Lo que se envía desde el formulario al crear o editar. Se vuelve a revisar en el servidor. */
export interface ContentInput {
  title: string;
  format: ContentFormat;
  status: ContentStatus;
  assigneeId: string | null;
  projectId: string | null;
  /** Instante exacto de publicación (hora de Argentina); null si no tiene fecha. */
  publishAt: string | null;
  copy: string;
  links: string[];
}
