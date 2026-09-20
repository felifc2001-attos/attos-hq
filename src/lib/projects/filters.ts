import { PROJECT_STATUSES, type ProjectStatus } from "../quick-create/constants";
import type { ProjectSummary } from "./types";

/** "activos" = en curso y planificando (igual que en el Inicio). */
export type ProjectFilter = "activos" | "todos" | ProjectStatus;

export const ACTIVE_STATUSES: readonly ProjectStatus[] = ["en_curso", "planificando"];

export const DEFAULT_PROJECT_FILTER: ProjectFilter = "activos";

export function parseProjectFilter(params: Record<string, string | string[] | undefined>): ProjectFilter {
  const raw = Array.isArray(params.estado) ? params.estado[0] : params.estado;
  if (raw === "todos") return "todos";
  return PROJECT_STATUSES.find((status) => status.value === raw)?.value ?? DEFAULT_PROJECT_FILTER;
}

export function projectFilterQuery(filter: ProjectFilter): string {
  return filter === DEFAULT_PROJECT_FILTER ? "" : `?estado=${filter}`;
}

export function matchesProjectFilter(status: ProjectStatus, filter: ProjectFilter): boolean {
  if (filter === "todos") return true;
  if (filter === "activos") return ACTIVE_STATUSES.includes(status);
  return status === filter;
}

// En la lista, primero lo que se está trabajando y al final lo terminado.
const STATUS_ORDER: Record<ProjectStatus, number> = {
  en_curso: 0,
  planificando: 1,
  pausado: 2,
  idea: 3,
  finalizado: 4,
};

/** Ordena para mostrar: por estado y, dentro de cada estado, la fecha objetivo más cercana primero. */
export function sortProjects(projects: ProjectSummary[]): ProjectSummary[] {
  return [...projects].sort((a, b) => {
    if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (a.targetDate !== b.targetDate) {
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return a.targetDate < b.targetDate ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "es");
  });
}
