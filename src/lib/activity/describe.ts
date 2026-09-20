import { formatShortDate, isValidISODate } from "../dates";
import type { Person } from "../tasks/types";

/** Una entrada del historial (tabla `activities`). */
export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  /** Título guardado al momento de la acción: se puede mostrar aunque el elemento ya no exista. */
  entityTitle: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: Person | null;
}

// Valores de la base que se escriben sin tilde ni eñe.
const ACCENTED: Record<string, string> = { diseno: "Diseño", produccion: "Producción", campana: "Campaña" };

/** "para_aprobar" → "Para aprobar", "en_desarrollo" → "En desarrollo", "diseno" → "Diseño". */
export function humanize(value: string): string {
  if (ACCENTED[value]) return ACCENTED[value];
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function describeUpdate(metadata: Record<string, unknown>, subject: string): string {
  const to = text(metadata.to);
  switch (metadata.field) {
    case "assignee":
      return to ? `reasignó ${subject} a ${to}` : `quitó la asignación de ${subject}`;
    case "due_date":
    case "date": // eventos del calendario
      return isValidISODate(to)
        ? `cambió la fecha de ${subject} al ${formatShortDate(to)}`
        : `quitó la fecha de ${subject}`;
    case "priority":
      return to ? `cambió la prioridad de ${subject} a ${humanize(to)}` : `cambió la prioridad de ${subject}`;
    case "converted":
      return to ? `convirtió ${subject} en ${to}` : `convirtió ${subject}`;
    default:
      return `actualizó ${subject}`;
  }
}

/**
 * La frase de una acción, sin el nombre de quien la hizo ("completó Diseño promo cerveza").
 * `subject` es lo que se muestra como objeto: el título en el feed del equipo, "esta tarea" en el historial de una tarea.
 */
export function describeActivity(action: string, metadata: Record<string, unknown>, subject: string): string {
  const to = text(metadata.to);
  switch (action) {
    case "creo":
      return `creó ${subject}`;
    case "completo":
      return `completó ${subject}`;
    case "movio":
      return to ? `movió ${subject} a ${humanize(to)}` : `movió ${subject}`;
    case "comento":
      return `comentó en ${subject}`;
    case "aprobo":
      return `aprobó ${subject}`;
    case "solicito_cambios":
      return `pidió cambios en ${subject}`;
    case "entrego":
      return `entregó ${subject}`;
    case "actualizo":
      return describeUpdate(metadata, subject);
    default:
      return `actualizó ${subject}`;
  }
}
