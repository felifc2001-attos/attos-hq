import { highlightParts } from "@/lib/search/text";

/** Un texto con lo que se buscó resaltado (sin importar tildes ni mayúsculas). */
export function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded bg-bordo-soft px-0.5 font-semibold text-bordo">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}
