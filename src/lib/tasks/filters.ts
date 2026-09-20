import {
  AREAS,
  PRIORITIES,
  STATUSES,
  type Area,
  type Priority,
  type TaskStatus,
} from "./constants";

export const DUE_FILTERS = [
  { value: "vencidas", label: "Vencidas" },
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Próximos 7 días" },
  { value: "sin_fecha", label: "Sin fecha" },
] as const;

export type DueFilter = (typeof DUE_FILTERS)[number]["value"];

export interface TaskFilters {
  /** Cómo se muestran: lista o tablero Kanban (el Kanban siempre muestra todos los estados). */
  view: "lista" | "kanban";
  /** "mias" = solo las asignadas a mí; "todas" = las de todo el equipo. */
  scope: "mias" | "todas";
  /** Id de una persona, o "sin_asignar". Solo aplica en "todas". */
  person: string | null;
  /** Id de un proyecto, o "sin_proyecto". */
  project: string | null;
  area: Area | null;
  status: TaskStatus | null;
  priority: Priority | null;
  due: DueFilter | null;
  showDone: boolean;
}

export const DEFAULT_FILTERS: TaskFilters = {
  view: "lista",
  scope: "mias",
  person: null,
  project: null,
  area: null,
  status: null,
  priority: null,
  due: null,
  showDone: false,
};

type RawParams = Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(options: readonly { value: T }[], value: string | undefined): T | null {
  return options.find((option) => option.value === value)?.value ?? null;
}

function idOr(special: string, value: string | undefined): string | null {
  if (!value) return null;
  return value === special || UUID.test(value) ? value : null;
}

/** Lee los filtros desde la URL. Todo lo que no sea un valor válido se ignora. */
export function parseFilters(params: RawParams): TaskFilters {
  const scope = first(params.vista) === "todas" ? "todas" : "mias";
  const view = first(params.modo) === "kanban" ? "kanban" : "lista";
  return {
    view,
    scope,
    person: scope === "todas" ? idOr("sin_asignar", first(params.persona)) : null,
    project: idOr("sin_proyecto", first(params.proyecto)),
    area: oneOf(AREAS, first(params.area)),
    // En el Kanban están todos los estados a la vista, así que estos dos filtros no aplican.
    status: view === "kanban" ? null : oneOf(STATUSES, first(params.estado)),
    priority: oneOf(PRIORITIES, first(params.prioridad)),
    due: oneOf(DUE_FILTERS, first(params.fecha)),
    showDone: view === "kanban" ? false : first(params.completadas) === "1",
  };
}

/** Arma la parte "?vista=todas&..." de la URL; lo que está en su valor por defecto se omite. */
export function filtersToQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();
  if (filters.view === "kanban") params.set("modo", "kanban");
  if (filters.scope === "todas") params.set("vista", "todas");
  if (filters.scope === "todas" && filters.person) params.set("persona", filters.person);
  if (filters.project) params.set("proyecto", filters.project);
  if (filters.area) params.set("area", filters.area);
  if (filters.status) params.set("estado", filters.status);
  if (filters.priority) params.set("prioridad", filters.priority);
  if (filters.due) params.set("fecha", filters.due);
  if (filters.showDone) params.set("completadas", "1");
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** ¿Hay algún filtro puesto (además de la pestaña Mis tareas / Todas y de Lista / Kanban)? */
export function hasActiveFilters(filters: TaskFilters): boolean {
  return Boolean(
    filters.person ||
      filters.project ||
      filters.area ||
      filters.status ||
      filters.priority ||
      filters.due ||
      filters.showDone,
  );
}
