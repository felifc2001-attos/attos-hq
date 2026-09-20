import { AREAS, type Area } from "../tasks/constants";
import type { IdeaItem } from "./types";

export const IDEA_STATES = [
  { value: "abiertas", label: "Abiertas" },
  { value: "convertidas", label: "Convertidas" },
  { value: "todas", label: "Todas" },
] as const;

export const IDEA_ORDERS = [
  { value: "votos", label: "Más votadas" },
  { value: "recientes", label: "Más nuevas" },
] as const;

export type IdeaState = (typeof IDEA_STATES)[number]["value"];
export type IdeaOrder = (typeof IDEA_ORDERS)[number]["value"];

export interface IdeaFilters {
  state: IdeaState;
  order: IdeaOrder;
  area: Area | null;
}

export const DEFAULT_IDEA_FILTERS: IdeaFilters = { state: "abiertas", order: "votos", area: null };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(options: readonly { value: T }[], value: string | undefined): T | null {
  return options.find((option) => option.value === value)?.value ?? null;
}

/** Lee los filtros desde la URL; lo que no sea un valor válido se ignora. */
export function parseIdeaFilters(params: Record<string, string | string[] | undefined>): IdeaFilters {
  return {
    state: oneOf(IDEA_STATES, first(params.estado)) ?? DEFAULT_IDEA_FILTERS.state,
    order: oneOf(IDEA_ORDERS, first(params.orden)) ?? DEFAULT_IDEA_FILTERS.order,
    area: oneOf(AREAS, first(params.area)),
  };
}

/** "?estado=todas&orden=recientes…"; lo que está en su valor por defecto se omite. */
export function ideaFiltersToQuery(filters: IdeaFilters): string {
  const params = new URLSearchParams();
  if (filters.state !== DEFAULT_IDEA_FILTERS.state) params.set("estado", filters.state);
  if (filters.order !== DEFAULT_IDEA_FILTERS.order) params.set("orden", filters.order);
  if (filters.area) params.set("area", filters.area);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function hasActiveIdeaFilters(filters: IdeaFilters): boolean {
  return (
    filters.state !== DEFAULT_IDEA_FILTERS.state ||
    filters.order !== DEFAULT_IDEA_FILTERS.order ||
    filters.area !== null
  );
}

export const isConverted = (idea: IdeaItem): boolean => idea.convertedTask !== null || idea.convertedProject !== null;

/** Filtra y ordena las ideas para mostrarlas. */
export function applyIdeaFilters(ideas: IdeaItem[], filters: IdeaFilters): IdeaItem[] {
  return ideas
    .filter((idea) => {
      if (filters.area && idea.area !== filters.area) return false;
      if (filters.state === "abiertas") return !isConverted(idea);
      if (filters.state === "convertidas") return isConverted(idea);
      return true;
    })
    .sort((a, b) => {
      const newestFirst = b.createdAt.localeCompare(a.createdAt);
      return filters.order === "votos" ? b.votes - a.votes || newestFirst : newestFirst;
    });
}
