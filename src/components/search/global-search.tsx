"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { groupHits } from "@/lib/search/group";
import { searchHitHref } from "@/lib/search/links";
import { searchSuggestions } from "@/lib/search/actions";
import { cleanQuery, isSearchable } from "@/lib/search/text";
import type { SearchHit, SearchResult } from "@/lib/search/types";
import { cn } from "@/lib/utils";
import { SearchResultRow } from "./search-result-row";

/** Se espera un momento después de la última letra antes de buscar. */
const DEBOUNCE_MS = 250;

const ERROR_RESULT: SearchResult = { ok: false, error: "No se pudo buscar. Probá de nuevo en unos segundos." };

// El buscador del encabezado: resultados rápidos mientras se escribe (con flechas y Enter),
// y "Ver todos" lleva a la página completa. El atajo "/" o Ctrl+K lo enfoca desde cualquier pantalla.
export function GlobalSearch() {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // El último resultado, con la búsqueda a la que corresponde: si ya no coincide con lo escrito, se muestra "Buscando…".
  const [answer, setAnswer] = useState<{ query: string; result: SearchResult } | null>(null);

  const query = cleanQuery(value);
  const searchable = isSearchable(query);

  useEffect(() => {
    if (!searchable) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchSuggestions(query).then(
        (result) => {
          if (!cancelled) setAnswer({ query, result });
        },
        () => {
          if (!cancelled) setAnswer({ query, result: ERROR_RESULT });
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchable]);

  const current = answer && answer.query === query ? answer.result : null;
  const loading = searchable && current === null;

  // Los resultados a los que se puede ir (un comentario de algo borrado no lleva a ningún lado), en el orden en que se ven.
  const groups = useMemo(() => {
    const hits: SearchHit[] = current?.ok ? current.hits.filter((hit) => searchHitHref(hit) !== null) : [];
    return groupHits(hits);
  }, [current]);
  const options = groups.flatMap((group) => group.hits);

  // Atajos: "/" y Ctrl/Cmd+K enfocan el buscador; hacer clic afuera lo cierra.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      const shortcut = (event.key === "k" && (event.ctrlKey || event.metaKey)) || (event.key === "/" && !typing);
      if (!shortcut) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
      setOpen(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function go(href: string) {
    close();
    setValue("");
    router.push(href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setOpen(true);
        setActive((index) => Math.min(index + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(index - 1, -1));
        break;
      case "Enter": {
        event.preventDefault();
        const chosen = active >= 0 ? searchHitHref(options[active]) : null;
        if (chosen) go(chosen);
        else if (searchable) go(`/buscar?q=${encodeURIComponent(query)}`);
        break;
      }
      case "Escape":
        close();
        inputRef.current?.blur();
        break;
    }
  }

  const showPanel = open && searchable;

  return (
    <div ref={boxRef} className="relative">
      <label className="relative block">
        <span className="sr-only">Buscar en ATTOS HQ</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={showPanel && active >= 0 ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          maxLength={80}
          placeholder="Buscar tareas, proyectos, ideas, contenido…"
          className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-12 text-sm text-ink shadow-card outline-none transition placeholder:text-muted focus:border-bordo focus:ring-4 focus:ring-bordo/10"
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-beige px-1.5 py-0.5 text-[0.7rem] font-semibold text-muted lg:block"
        >
          /
        </kbd>
      </label>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Resultados de la búsqueda"
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-float"
        >
          {loading && <p className="px-3 py-3 text-sm text-muted">Buscando…</p>}
          {current && !current.ok && (
            <p role="alert" className="px-3 py-3 text-sm text-prio-urgent">
              {current.error}
            </p>
          )}
          {current?.ok && options.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted">No encontramos nada para “{query}”.</p>
          )}

          {groups.map((group) => (
            <div key={group.kind} role="group" aria-label={group.label} className="mb-1">
              <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-muted">{group.label}</p>
              {group.hits.map((hit) => {
                const index = options.indexOf(hit); // su lugar en la lista completa, para las flechas del teclado
                return (
                  <div
                    key={`${hit.kind}-${hit.id}`}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                  >
                    <SearchResultRow
                      hit={hit}
                      query={query}
                      compact
                      onNavigate={() => {
                        close();
                        setValue("");
                      }}
                      className={cn(index === active && "bg-beige/80")}
                    />
                  </div>
                );
              })}
            </div>
          ))}

          <Link
            href={`/buscar?q=${encodeURIComponent(query)}`}
            onClick={() => {
              close();
              setValue("");
            }}
            className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-semibold text-bordo transition hover:bg-bordo-soft"
          >
            Ver todos los resultados de “{query}”
          </Link>
        </div>
      )}
    </div>
  );
}
