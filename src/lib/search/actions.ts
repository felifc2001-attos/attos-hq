"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { searchAll } from "./queries";
import { cleanQuery, isSearchable } from "./text";
import type { SearchResult } from "./types";

/** Cuántos resultados por tipo se muestran en el desplegable del buscador (la página completa muestra más). */
const SUGGESTIONS_PER_KIND = 4;

/** Resultados rápidos mientras se escribe en el buscador del encabezado. */
export async function searchSuggestions(rawQuery: unknown): Promise<SearchResult> {
  const query = cleanQuery(rawQuery);
  if (!isSearchable(query)) return { ok: true, hits: [] };

  await getCurrentUser(); // verifica que haya sesión
  return searchAll(query, SUGGESTIONS_PER_KIND);
}
