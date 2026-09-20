import "server-only";

import { createClient } from "@/lib/supabase/server";
import { cleanQuery, isSearchable } from "./text";
import { isSearchKind, type SearchHit, type SearchResult } from "./types";

interface SearchRow {
  kind: string;
  item_id: string;
  title: string | null;
  detail: string | null;
  status: string | null;
  in_title: boolean | null;
  ref_type: string | null;
  ref_id: string | null;
  updated_at: string;
}

// La función de la base todavía no existe: falta ejecutar el archivo de la Etapa 9 en Supabase.
const MISSING_FUNCTION = new Set(["PGRST202", "42883"]);

/** Busca en tareas, proyectos, ideas, contenido, problemas y comentarios; hasta `limit` resultados por tipo. */
export async function searchAll(rawQuery: string, limit: number): Promise<SearchResult> {
  const query = cleanQuery(rawQuery);
  if (!isSearchable(query)) return { ok: true, hits: [] };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_all", { p_query: query, p_limit: limit });

  if (error) {
    console.error("[búsqueda]", error.code, error.message);
    if (MISSING_FUNCTION.has(error.code ?? "")) {
      return { ok: false, error: "La búsqueda todavía no está activada: falta ejecutar el archivo de la Etapa 9 en Supabase." };
    }
    return { ok: false, error: "No se pudo buscar. Probá de nuevo en unos segundos." };
  }

  const hits: SearchHit[] = ((data ?? []) as SearchRow[]).flatMap((row) =>
    isSearchKind(row.kind)
      ? [
          {
            kind: row.kind,
            id: row.item_id,
            title: row.title ?? "",
            detail: row.detail,
            status: row.status,
            inTitle: row.in_title === true,
            refType: row.ref_type,
            refId: row.ref_id,
            updatedAt: row.updated_at,
          },
        ]
      : [],
  );
  return { ok: true, hits };
}
