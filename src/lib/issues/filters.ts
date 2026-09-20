import { ISSUE_CATEGORIES, type IssueCategory } from "../quick-create/constants";
import { PRIORITIES, type Priority } from "../tasks/constants";
import { RESOLVED_STATUS } from "./constants";
import type { IssueItem } from "./types";

export const ISSUE_VIEWS = [
  { value: "todos", label: "Todos" },
  { value: "bandeja", label: "Bandeja de Sistemas" },
  { value: "mios", label: "Asignados a mí" },
  { value: "reportados", label: "Reportados por mí" },
] as const;

export type IssueView = (typeof ISSUE_VIEWS)[number]["value"];

export interface IssueFilters {
  view: IssueView;
  category: IssueCategory | null;
  priority: Priority | null;
}

export const DEFAULT_ISSUE_FILTERS: IssueFilters = { view: "todos", category: null, priority: null };

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(options: readonly { value: T }[], value: string | undefined): T | null {
  return options.find((option) => option.value === value)?.value ?? null;
}

/** Lee los filtros desde la URL; lo que no sea un valor válido se ignora. */
export function parseIssueFilters(params: RawParams): IssueFilters {
  return {
    view: oneOf(ISSUE_VIEWS, first(params.ver)) ?? DEFAULT_ISSUE_FILTERS.view,
    category: oneOf(ISSUE_CATEGORIES, first(params.tipo)),
    priority: oneOf(PRIORITIES, first(params.prioridad)),
  };
}

/** "?ver=bandeja&tipo=bug"; lo que está en su valor por defecto se omite. */
export function issueFiltersToQuery(filters: IssueFilters): string {
  const params = new URLSearchParams();
  if (filters.view !== DEFAULT_ISSUE_FILTERS.view) params.set("ver", filters.view);
  if (filters.category) params.set("tipo", filters.category);
  if (filters.priority) params.set("prioridad", filters.priority);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** ¿Hay algún filtro puesto (además de la pestaña)? */
export function hasActiveIssueFilters(filters: IssueFilters): boolean {
  return filters.category !== null || filters.priority !== null;
}

/** Los problemas que están esperando que alguien los tome (sin responsable y todavía sin resolver). */
export const isInTray = (issue: IssueItem): boolean => issue.assigneeId === null && issue.status !== RESOLVED_STATUS;

export function applyIssueFilters(issues: IssueItem[], filters: IssueFilters, meId: string): IssueItem[] {
  return issues.filter((issue) => {
    if (filters.category && issue.category !== filters.category) return false;
    if (filters.priority && issue.priority !== filters.priority) return false;
    switch (filters.view) {
      case "bandeja":
        return isInTray(issue);
      case "mios":
        return issue.assigneeId === meId;
      case "reportados":
        return issue.reporterId === meId;
      default:
        return true;
    }
  });
}
