import { AREAS, PRIORITIES, STATUSES } from "./constants";
import { isValidISODate } from "../dates";
import type { TaskInput } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 5000;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export type ParseResult = { ok: true; value: TaskInput } | { ok: false; error: string };

/**
 * Revisa lo que llega desde el formulario. Se hace en el servidor porque
 * nadie garantiza que la llamada venga de nuestro formulario.
 */
export function parseTaskInput(raw: unknown): ParseResult {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Datos inválidos." };
  const input = raw as Record<string, unknown>;

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) return { ok: false, error: "Escribí un título para la tarea." };
  if (title.length > TITLE_MAX) {
    return { ok: false, error: `El título es muy largo (máximo ${TITLE_MAX} caracteres).` };
  }

  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (description.length > DESCRIPTION_MAX) {
    return { ok: false, error: `La descripción es muy larga (máximo ${DESCRIPTION_MAX} caracteres).` };
  }

  const assigneeId = input.assigneeId ?? null;
  if (assigneeId !== null && !isUuid(assigneeId)) return { ok: false, error: "La persona elegida no es válida." };

  const projectId = input.projectId ?? null;
  if (projectId !== null && !isUuid(projectId)) return { ok: false, error: "El proyecto elegido no es válido." };

  const area = input.area ?? null;
  if (area !== null && !AREAS.some((option) => option.value === area)) {
    return { ok: false, error: "El área elegida no es válida." };
  }

  const dueDate = input.dueDate ?? null;
  if (dueDate !== null && (typeof dueDate !== "string" || !isValidISODate(dueDate))) {
    return { ok: false, error: "La fecha no es válida." };
  }

  const priority = PRIORITIES.find((option) => option.value === input.priority)?.value;
  if (!priority) return { ok: false, error: "La prioridad elegida no es válida." };

  const status = STATUSES.find((option) => option.value === input.status)?.value;
  if (!status) return { ok: false, error: "El estado elegido no es válido." };

  return {
    ok: true,
    value: {
      title,
      description,
      assigneeId,
      area: area as TaskInput["area"],
      projectId,
      dueDate,
      priority,
      status,
    },
  };
}
