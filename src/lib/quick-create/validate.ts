import { arToISO, isValidISODate } from "../dates";
import { AREAS, PRIORITIES } from "../tasks/constants";
import { isUuid } from "../tasks/validate";
import {
  EVENT_CATEGORIES,
  EVENT_KINDS,
  ISSUE_CATEGORIES,
  PROJECT_STATUSES,
} from "./constants";
import type { DependencyInput, IdeaInput, IssueInput, ProjectInput } from "./types";

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const TITLE_MAX = 200;
const NAME_MAX = 120;
const LONG_MAX = 5000;
const MAX_MEMBERS = 50;
export const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export function asRecord(raw: unknown): Record<string, unknown> | null {
  return typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : null;
}

/** Texto recortado. Devuelve un mensaje de error si falta (cuando es obligatorio) o es demasiado largo. */
export function readText(value: unknown, label: string, max: number, required: boolean): string | { error: string } {
  const text = typeof value === "string" ? value.trim() : "";
  if (required && !text) return { error: `Completá ${label}.` };
  if (text.length > max) return { error: `${label[0].toUpperCase()}${label.slice(1)} es muy largo (máximo ${max} caracteres).` };
  return text;
}

export const isError = (value: string | { error: string }): value is { error: string } => typeof value !== "string";

export function readOption<T extends string>(options: readonly { value: T }[], value: unknown): T | null {
  return options.find((option) => option.value === value)?.value ?? null;
}

/** null si está vacío; undefined si tiene algo pero no es una fecha real. */
export function readDate(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  return typeof value === "string" && isValidISODate(value) ? value : undefined;
}

export function readId(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  return isUuid(value) ? value : undefined;
}

export function parseIdeaInput(raw: unknown): Parsed<IdeaInput> {
  const input = asRecord(raw);
  if (!input) return fail("Datos inválidos.");

  const title = readText(input.title, "el título", TITLE_MAX, true);
  if (isError(title)) return fail(title.error);
  const description = readText(input.description, "la descripción", LONG_MAX, false);
  if (isError(description)) return fail(description.error);

  const area = input.area ?? null;
  if (area !== null && !readOption(AREAS, area)) return fail("El área elegida no es válida.");

  return { ok: true, value: { title, description, area: area as IdeaInput["area"] } };
}

export function parseIssueInput(raw: unknown): Parsed<IssueInput> {
  const input = asRecord(raw);
  if (!input) return fail("Datos inválidos.");

  const title = readText(input.title, "el título", TITLE_MAX, true);
  if (isError(title)) return fail(title.error);
  const description = readText(input.description, "la descripción", LONG_MAX, false);
  if (isError(description)) return fail(description.error);
  const steps = readText(input.steps, "el paso a paso", LONG_MAX, false);
  if (isError(steps)) return fail(steps.error);

  const category = readOption(ISSUE_CATEGORIES, input.category);
  if (!category) return fail("El tipo de problema no es válido.");
  const priority = readOption(PRIORITIES, input.priority);
  if (!priority) return fail("La prioridad elegida no es válida.");
  const assigneeId = readId(input.assigneeId);
  if (assigneeId === undefined) return fail("La persona elegida no es válida.");

  return { ok: true, value: { title, description, steps, category, priority, assigneeId } };
}

/** Un evento ya con sus instantes exactos (hora de Argentina), listo para guardar. */
export interface ParsedEvent {
  title: string;
  description: string;
  category: (typeof EVENT_CATEGORIES)[number]["value"];
  kind: (typeof EVENT_KINDS)[number]["value"];
  allDay: boolean;
  startsAt: string;
  endsAt: string | null;
  projectId: string | null;
}

export function parseEventInput(raw: unknown): Parsed<ParsedEvent> {
  const input = asRecord(raw);
  if (!input) return fail("Datos inválidos.");

  const title = readText(input.title, "el título", TITLE_MAX, true);
  if (isError(title)) return fail(title.error);
  const description = readText(input.description, "la descripción", LONG_MAX, false);
  if (isError(description)) return fail(description.error);

  const category = readOption(EVENT_CATEGORIES, input.category);
  if (!category) return fail("La categoría elegida no es válida.");
  const kind = readOption(EVENT_KINDS, input.kind);
  if (!kind) return fail("El tipo de evento no es válido.");
  const projectId = readId(input.projectId);
  if (projectId === undefined) return fail("El proyecto elegido no es válido.");

  const date = readDate(input.date);
  if (!date) return fail("Elegí la fecha del evento.");
  const allDay = input.allDay === true;

  let startsAt: string;
  let endsAt: string | null = null;

  if (allDay) {
    const endDate = readDate(input.endDate);
    if (endDate === undefined) return fail("La fecha de fin no es válida.");
    if (endDate && endDate < date) return fail("El evento no puede terminar antes de empezar.");
    startsAt = arToISO(date);
    endsAt = endDate ? arToISO(endDate) : null;
  } else {
    const startTime = typeof input.startTime === "string" ? input.startTime : "";
    if (!TIME.test(startTime)) return fail("Elegí la hora de inicio.");
    startsAt = arToISO(date, startTime);

    const endTime = input.endTime === null || input.endTime === undefined || input.endTime === "" ? null : input.endTime;
    if (endTime !== null) {
      if (typeof endTime !== "string" || !TIME.test(endTime)) return fail("La hora de fin no es válida.");
      endsAt = arToISO(date, endTime);
      if (endsAt < startsAt) return fail("El evento no puede terminar antes de empezar.");
    }
  }

  return { ok: true, value: { title, description, category, kind, allDay, startsAt, endsAt, projectId } };
}

export function parseProjectInput(raw: unknown): Parsed<ProjectInput> {
  const input = asRecord(raw);
  if (!input) return fail("Datos inválidos.");

  const name = readText(input.name, "el nombre", NAME_MAX, true);
  if (isError(name)) return fail(name.error);
  const description = readText(input.description, "la descripción", LONG_MAX, false);
  if (isError(description)) return fail(description.error);

  const status = readOption(PROJECT_STATUSES, input.status);
  if (!status) return fail("El estado elegido no es válido.");
  const ownerId = readId(input.ownerId);
  if (ownerId === undefined) return fail("El responsable elegido no es válido.");

  const startDate = readDate(input.startDate);
  if (startDate === undefined) return fail("La fecha de inicio no es válida.");
  const targetDate = readDate(input.targetDate);
  if (targetDate === undefined) return fail("La fecha objetivo no es válida.");
  if (startDate && targetDate && targetDate < startDate) {
    return fail("La fecha objetivo no puede ser anterior al inicio.");
  }

  const members = Array.isArray(input.memberIds) ? input.memberIds : [];
  if (members.length > MAX_MEMBERS || !members.every(isUuid)) return fail("Los integrantes elegidos no son válidos.");

  return {
    ok: true,
    value: { name, description, ownerId, status, startDate, targetDate, memberIds: [...new Set(members as string[])] },
  };
}

export function parseDependencyInput(raw: unknown): Parsed<DependencyInput> {
  const input = asRecord(raw);
  if (!input) return fail("Datos inválidos.");

  if (!isUuid(input.providerId)) return fail("Elegí de quién lo necesitás.");
  const title = readText(input.title, "qué necesitás", TITLE_MAX, true);
  if (isError(title)) return fail(title.error);
  const description = readText(input.description, "la descripción", LONG_MAX, false);
  if (isError(description)) return fail(description.error);

  const dueDate = readDate(input.dueDate);
  if (dueDate === undefined) return fail("La fecha no es válida.");
  const taskId = readId(input.taskId);
  if (taskId === undefined) return fail("La tarea elegida no es válida.");
  const projectId = readId(input.projectId);
  if (projectId === undefined) return fail("El proyecto elegido no es válido.");

  return { ok: true, value: { providerId: input.providerId, title, description, dueDate, taskId, projectId } };
}
