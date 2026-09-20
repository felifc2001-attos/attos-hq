// Opciones de los formularios de creación rápida. Los valores son los que acepta la base de datos.

export const ISSUE_CATEGORIES = [
  { value: "bug", label: "Error" },
  { value: "mejora", label: "Mejora" },
  { value: "nueva_funcionalidad", label: "Nueva funcionalidad" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "idea_tecnica", label: "Idea técnica" },
] as const;

export const EVENT_CATEGORIES = [
  { value: "comercial", label: "Comercial" },
  { value: "marketing", label: "Marketing" },
  { value: "sistemas", label: "Sistemas" },
  { value: "operaciones", label: "Operaciones" },
  { value: "reuniones", label: "Reuniones" },
] as const;

export const EVENT_KINDS = [
  { value: "reunion", label: "Reunión" },
  { value: "campana", label: "Campaña" },
  { value: "lanzamiento", label: "Lanzamiento" },
  { value: "evento", label: "Evento" },
  { value: "fecha_comercial", label: "Fecha comercial" },
  { value: "deadline", label: "Fecha límite" },
  { value: "otro", label: "Otro" },
] as const;

export const PROJECT_STATUSES = [
  { value: "idea", label: "Idea" },
  { value: "planificando", label: "Planificando" },
  { value: "en_curso", label: "En curso" },
  { value: "pausado", label: "Pausado" },
  { value: "finalizado", label: "Finalizado" },
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number]["value"];
export type EventCategory = (typeof EVENT_CATEGORIES)[number]["value"];
export type EventKind = (typeof EVENT_KINDS)[number]["value"];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];
