/** Los tipos de resultado, en el orden en que se muestran. Coinciden con `entity_type` de la base (salvo "comment"). */
export const SEARCH_KINDS = [
  { value: "task", label: "Tareas", singular: "Tarea" },
  { value: "project", label: "Proyectos", singular: "Proyecto" },
  { value: "idea", label: "Ideas", singular: "Idea" },
  { value: "content_item", label: "Contenido", singular: "Publicación" },
  { value: "system_issue", label: "Sistemas", singular: "Problema" },
  { value: "comment", label: "Comentarios", singular: "Comentario" },
] as const;

export type SearchKind = (typeof SEARCH_KINDS)[number]["value"];

export function isSearchKind(value: unknown): value is SearchKind {
  return SEARCH_KINDS.some((kind) => kind.value === value);
}

/** Un resultado de la búsqueda global. */
export interface SearchHit {
  kind: SearchKind;
  id: string;
  /** El título. En un comentario es el del elemento del que cuelga (vacío si ya no existe). */
  title: string;
  /** El texto más largo donde se encontró: descripción, copy, pasos, comentario… */
  detail: string | null;
  status: string | null;
  /** ¿Todas las palabras están en el título? */
  inTitle: boolean;
  /** Solo en comentarios: el tipo y el id del elemento del que cuelgan. */
  refType: string | null;
  refId: string | null;
  updatedAt: string;
}

export type SearchResult = { ok: true; hits: SearchHit[] } | { ok: false; error: string };
