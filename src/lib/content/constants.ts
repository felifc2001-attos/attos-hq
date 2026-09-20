import type { BadgeTone } from "@/components/ui/badge";

// Opciones del contenido de marketing. Los valores son los que acepta la base de datos
// (tipos content_format, content_status y review_status).

export const CONTENT_FORMATS = [
  { value: "reel", label: "Reel" },
  { value: "historia", label: "Historia" },
  { value: "post", label: "Post" },
  { value: "campana", label: "Campaña" },
  { value: "publicidad", label: "Publicidad" },
  { value: "otro", label: "Otro" },
] as const;

/** Las columnas del recorrido de una publicación, de izquierda a derecha. */
export const CONTENT_STATUSES = [
  { value: "ideas", label: "Ideas", tone: "neutral" },
  { value: "produccion", label: "Producción", tone: "doing" },
  { value: "diseno", label: "Diseño", tone: "wine" },
  { value: "para_aprobar", label: "Para aprobar", tone: "review" },
  { value: "programado", label: "Programado", tone: "mid" },
  { value: "publicado", label: "Publicado", tone: "done" },
] as const satisfies readonly { value: string; label: string; tone: BadgeTone }[];

export const REVIEW_STATUSES = [
  { value: "pendiente", label: "Sin revisar" },
  { value: "aprobado", label: "Aprobado" },
  { value: "cambios_solicitados", label: "Cambios pedidos" },
] as const;

export type ContentFormat = (typeof CONTENT_FORMATS)[number]["value"];
export type ContentStatus = (typeof CONTENT_STATUSES)[number]["value"];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]["value"];

/** En la columna "Publicado" solo se ve lo publicado en los últimos días. */
export const CONTENT_PUBLISHED_DAYS = 30;

/** El nombre de un valor ("para_aprobar" → "Para aprobar"); si no se conoce, el valor tal cual. */
export function labelOf(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
