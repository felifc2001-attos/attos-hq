import type { BadgeTone } from "@/components/ui/badge";

interface Option<T extends string> {
  value: T;
  label: string;
  tone: BadgeTone;
}

// Los valores son los mismos que acepta la base de datos (tipos task_status, priority_level, work_area).

export const STATUSES = [
  { value: "por_hacer", label: "Por hacer", tone: "todo" },
  { value: "en_curso", label: "En curso", tone: "doing" },
  { value: "para_revisar", label: "Para revisar", tone: "review" },
  { value: "listo", label: "Listo", tone: "done" },
] as const satisfies readonly Option<string>[];

export const PRIORITIES = [
  { value: "baja", label: "Baja", tone: "low" },
  { value: "media", label: "Media", tone: "mid" },
  { value: "alta", label: "Alta", tone: "high" },
  { value: "urgente", label: "Urgente", tone: "urgent" },
] as const satisfies readonly Option<string>[];

export const AREAS = [
  { value: "comercial", label: "Comercial", tone: "wine" },
  { value: "operaciones", label: "Operaciones", tone: "neutral" },
  { value: "marketing", label: "Marketing", tone: "neutral" },
  { value: "sistemas", label: "Sistemas", tone: "neutral" },
] as const satisfies readonly Option<string>[];

export type TaskStatus = (typeof STATUSES)[number]["value"];
export type Priority = (typeof PRIORITIES)[number]["value"];
export type Area = (typeof AREAS)[number]["value"];

/** Cuántos días atrás llega la columna "Listo" del Kanban. */
export const KANBAN_DONE_DAYS = 14;

/** Mayor número = más importante. */
export const PRIORITY_RANK: Record<Priority, number> = {
  baja: 0,
  media: 1,
  alta: 2,
  urgente: 3,
};

export function findOption<T extends string>(
  options: readonly Option<T>[],
  value: T,
): Option<T> {
  return options.find((option) => option.value === value) ?? options[0];
}
