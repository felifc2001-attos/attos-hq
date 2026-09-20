import type { BadgeTone } from "@/components/ui/badge";

// Opciones de los problemas y mejoras del sistema. Los valores son los que acepta la base de datos (tipo issue_status).

/** Las columnas del recorrido de un problema, de izquierda a derecha. */
export const ISSUE_STATUSES = [
  { value: "reportado", label: "Reportado", tone: "todo" },
  { value: "por_revisar", label: "Por revisar", tone: "review" },
  { value: "en_desarrollo", label: "En desarrollo", tone: "doing" },
  { value: "testing", label: "Testing", tone: "wine" },
  { value: "produccion", label: "En producción", tone: "done" },
] as const satisfies readonly { value: string; label: string; tone: BadgeTone }[];

export type IssueStatus = (typeof ISSUE_STATUSES)[number]["value"];

/** El color de la etiqueta de cada tipo de problema (los tipos y sus nombres están en quick-create/constants). */
export const ISSUE_CATEGORY_TONES = {
  bug: "urgent",
  mejora: "mid",
  nueva_funcionalidad: "wine",
  mantenimiento: "todo",
  idea_tecnica: "neutral",
} as const satisfies Record<string, BadgeTone>;

/** En la columna "En producción" solo se ve lo resuelto en los últimos días. */
export const ISSUE_DONE_DAYS = 30;

/** El estado al que llega un problema cuando ya está resuelto. */
export const RESOLVED_STATUS: IssueStatus = "produccion";
