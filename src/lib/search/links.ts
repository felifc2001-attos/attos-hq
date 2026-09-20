import { notificationHref } from "../notifications/links";
import type { SearchHit } from "./types";

/**
 * A dónde lleva un resultado: a la tarea, el proyecto, la idea, la publicación o el problema
 * (los mismos enlaces directos que las notificaciones); un comentario lleva a lo que se comentó.
 * Devuelve null si ya no hay a dónde ir.
 */
export function searchHitHref(hit: Pick<SearchHit, "kind" | "id" | "refType" | "refId">): string | null {
  if (hit.kind === "comment") return hit.refId ? notificationHref(hit.refType, hit.refId) : null;
  return notificationHref(hit.kind, hit.id);
}
