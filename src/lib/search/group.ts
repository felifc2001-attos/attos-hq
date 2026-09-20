import { SEARCH_KINDS, type SearchHit, type SearchKind } from "./types";

export interface SearchGroup {
  kind: SearchKind;
  label: string;
  hits: SearchHit[];
}

/** Los resultados agrupados por tipo, en el orden de siempre (tareas, proyectos, ideas…). Los tipos sin resultados no aparecen. */
export function groupHits(hits: SearchHit[]): SearchGroup[] {
  return SEARCH_KINDS.flatMap((kind) => {
    const inGroup = hits.filter((hit) => hit.kind === kind.value);
    return inGroup.length > 0 ? [{ kind: kind.value, label: kind.label, hits: inGroup }] : [];
  });
}
