// Cuentas de texto de la búsqueda global: se comparan sin mayúsculas ni tildes, igual que en la base
// (public.norm_text), para poder resaltar en pantalla lo mismo que encontró la búsqueda.

const MARKS = /\p{M}/gu;
const MAX_QUERY = 80;
const MAX_TERMS = 6;

/** Minúsculas y sin tildes, letra por letra: el resultado siempre mide lo mismo que el original, así las posiciones coinciden. */
export function normalize(text: string): string {
  let out = "";
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const plain = char.normalize("NFD").replace(MARKS, "").toLowerCase();
    out += plain.length === 1 ? plain : char.toLowerCase().slice(0, 1) || char;
  }
  return out;
}

/** Lo que escribió la persona, listo para buscar: recortado, con los espacios juntos y con un máximo. */
export function cleanQuery(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY).trim();
}

/** Hacen falta al menos 2 letras para buscar. */
export function isSearchable(query: string): boolean {
  return query.length >= 2;
}

/** Las palabras que se buscan (todas tienen que aparecer), ya normalizadas. */
export function queryTerms(query: string): string[] {
  return normalize(query)
    .split(" ")
    .filter((term) => term.length > 0)
    .slice(0, MAX_TERMS);
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

/** Las posiciones [desde, hasta) de todas las palabras buscadas en un texto, sin superponerse. */
function matchRanges(text: string, terms: string[]): [number, number][] {
  const haystack = normalize(text);
  const ranges: [number, number][] = [];
  for (const term of terms) {
    for (let from = haystack.indexOf(term); from !== -1; from = haystack.indexOf(term, from + term.length)) {
      ranges.push([from, from + term.length]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);

  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

/** El texto partido en pedazos, marcando cuáles son lo que se buscó. */
export function highlightParts(text: string, query: string): HighlightPart[] {
  const terms = queryTerms(query);
  if (!text || terms.length === 0) return [{ text, match: false }];

  const parts: HighlightPart[] = [];
  let cursor = 0;
  for (const [start, end] of matchRanges(text, terms)) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false });
    parts.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts.length > 0 ? parts : [{ text, match: false }];
}

/** Un fragmento corto del texto alrededor de la primera coincidencia ("… lista de precios …"). */
export function excerpt(text: string, query: string, radius = 60): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const [first] = matchRanges(flat, queryTerms(query));

  // Con coincidencia: un poco antes y un poco después. Sin ella (no debería pasar): el comienzo del texto.
  const start = first ? Math.max(0, first[0] - radius) : 0;
  const end = Math.min(flat.length, first ? first[1] + radius : radius * 2);
  if (start === 0 && end === flat.length) return flat;
  return `${start > 0 ? "…" : ""}${flat.slice(start, end).trim()}${end < flat.length ? "…" : ""}`;
}
