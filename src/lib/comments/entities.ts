// Los comentarios y el historial son "genéricos": cuelgan de cualquier elemento con (tipo, id).
// Estos son los tipos que hoy tienen comentarios en la app.

export const COMMENT_ENTITY_TYPES = ["task", "project", "idea", "dependency", "content_item", "system_issue"] as const;

export type CommentEntityType = (typeof COMMENT_ENTITY_TYPES)[number];

/** Cómo se nombra cada tipo en las frases del historial ("comentó en esta tarea"). */
export const ENTITY_SUBJECT: Record<CommentEntityType, string> = {
  task: "esta tarea",
  project: "este proyecto",
  idea: "esta idea",
  dependency: "este pedido",
  content_item: "esta publicación",
  system_issue: "este problema",
};

export function isCommentEntityType(value: unknown): value is CommentEntityType {
  return COMMENT_ENTITY_TYPES.some((type) => type === value);
}
