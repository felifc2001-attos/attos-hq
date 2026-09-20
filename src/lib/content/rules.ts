// Reglas de aprobación del contenido.
//
// - Para pasar a "Programado" o "Publicado" tiene que estar aprobado.
// - Al pasar a "Para aprobar" se pide la revisión: queda "sin revisar" y se avisa al equipo.
// - Si algo ya aprobado vuelve a Ideas, Producción o Diseño (se retoca), la aprobación se pierde.
// - Aprobar lo programa si ya tiene fecha; pedir cambios lo devuelve a Diseño.

import type { ContentStatus, ReviewStatus } from "./constants";

const NEEDS_APPROVAL: readonly ContentStatus[] = ["programado", "publicado"];
const REWORK: readonly ContentStatus[] = ["ideas", "produccion", "diseno"];

export type StatusPlan =
  | { ok: false; error: string }
  | {
      ok: true;
      /** ¿Cambia de columna? */
      changed: boolean;
      /** La revisión pasa a este valor (y se borra quién la hizo); null = no se toca. */
      review: ReviewStatus | null;
      /** Hay que avisar al equipo que hay algo para aprobar. */
      notifyApprovers: boolean;
    };

/** Qué pasa al llevar una publicación de una columna a otra. */
export function planContentStatus(from: ContentStatus, to: ContentStatus, review: ReviewStatus): StatusPlan {
  if (from === to) return { ok: true, changed: false, review: null, notifyApprovers: false };

  if (NEEDS_APPROVAL.includes(to) && review !== "aprobado") {
    return { ok: false, error: "Primero tiene que estar aprobado: pasalo a “Para aprobar” para que lo revisen." };
  }
  if (to === "para_aprobar") return { ok: true, changed: true, review: "pendiente", notifyApprovers: true };
  if (NEEDS_APPROVAL.includes(from) && REWORK.includes(to)) {
    return { ok: true, changed: true, review: "pendiente", notifyApprovers: false };
  }
  return { ok: true, changed: true, review: null, notifyApprovers: false };
}

/** A dónde va una publicación al aprobarla: a Programado si ya tiene fecha; si no, se queda esperando una. */
export function statusAfterApproval(publishAt: string | null): ContentStatus {
  return publishAt ? "programado" : "para_aprobar";
}

/** Una publicación solo se aprueba o se le piden cambios mientras está en "Para aprobar". */
export function canReview(status: ContentStatus): boolean {
  return status === "para_aprobar";
}
