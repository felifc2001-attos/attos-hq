import { CONTENT_FORMATS, type ContentFormat } from "./constants";
import type { ContentItem } from "./types";

export interface ContentFilters {
  /** Id de una persona, o "sin_asignar". */
  person: string | null;
  format: ContentFormat | null;
  /** Id de un proyecto, o "sin_proyecto". */
  project: string | null;
}

export const DEFAULT_CONTENT_FILTERS: ContentFilters = { person: null, format: null, project: null };

type RawParams = Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function idOr(special: string, value: string | undefined): string | null {
  if (!value) return null;
  return value === special || UUID.test(value) ? value : null;
}

/** Lee los filtros desde la URL; lo que no sea un valor válido se ignora. */
export function parseContentFilters(params: RawParams): ContentFilters {
  return {
    person: idOr("sin_asignar", first(params.persona)),
    format: CONTENT_FORMATS.find((option) => option.value === first(params.formato))?.value ?? null,
    project: idOr("sin_proyecto", first(params.proyecto)),
  };
}

/** "?persona=…&formato=reel"; lo que no está puesto se omite. */
export function contentFiltersToQuery(filters: ContentFilters): string {
  const params = new URLSearchParams();
  if (filters.person) params.set("persona", filters.person);
  if (filters.format) params.set("formato", filters.format);
  if (filters.project) params.set("proyecto", filters.project);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function hasActiveContentFilters(filters: ContentFilters): boolean {
  return filters.person !== null || filters.format !== null || filters.project !== null;
}

export function applyContentFilters(items: ContentItem[], filters: ContentFilters): ContentItem[] {
  return items.filter((item) => {
    if (filters.person === "sin_asignar" ? item.assigneeId !== null : filters.person && item.assigneeId !== filters.person) {
      return false;
    }
    if (filters.format && item.format !== filters.format) return false;
    if (filters.project === "sin_proyecto" ? item.projectId !== null : filters.project && item.projectId !== filters.project) {
      return false;
    }
    return true;
  });
}
