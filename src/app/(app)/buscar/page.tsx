import type { Metadata } from "next";
import { Search, SearchX } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchResultRow } from "@/components/search/search-result-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inputClass } from "@/components/ui/form-controls";
import { groupHits } from "@/lib/search/group";
import { searchAll } from "@/lib/search/queries";
import { cleanQuery, isSearchable } from "@/lib/search/text";

/** Cuántos resultados de cada tipo se muestran en la página completa. */
const PER_KIND = 12;

export const metadata: Metadata = { title: "Buscar" };

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = cleanQuery(Array.isArray(params.q) ? params.q[0] : params.q);
  const searchable = isSearchable(query);
  const result = searchable ? await searchAll(query, PER_KIND) : null;
  const groups = result?.ok ? groupHits(result.hits) : [];

  return (
    <>
      <PageHeader title="Buscar" subtitle="En tareas, proyectos, ideas, contenido, Sistemas y comentarios." />

      <form action="/buscar" role="search" className="mb-8 flex max-w-2xl gap-2">
        <label className="relative block flex-1">
          <span className="sr-only">Qué buscar</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            name="q"
            type="search"
            defaultValue={query}
            autoFocus
            maxLength={80}
            placeholder="Buscar…"
            className={`${inputClass} pl-11`}
          />
        </label>
        <Button type="submit">Buscar</Button>
      </form>

      {!searchable && (
        <p className="text-sm text-muted">
          {query ? "Escribí al menos 2 letras." : "Escribí lo que buscás. No importan las mayúsculas ni las tildes, y podés poner varias palabras."}
        </p>
      )}

      {result && !result.ok && (
        <p role="alert" className="rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
          {result.error}
        </p>
      )}

      {result?.ok && groups.length === 0 && (
        <Card className="mx-auto max-w-xl p-10 text-center">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-bordo-soft text-bordo">
            <SearchX className="size-7" aria-hidden />
          </span>
          <p className="mt-4 font-semibold text-ink">No encontramos nada para “{query}”.</p>
          <p className="mt-1 text-sm text-muted">Probá con menos palabras o con otra forma de escribirlo.</p>
        </Card>
      )}

      {groups.length > 0 && (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.kind} aria-label={group.label}>
              <h2 className="mb-2 flex items-baseline gap-2 font-display text-xl font-semibold text-ink">
                {group.label}
                <span className="text-sm font-semibold text-muted">
                  {group.hits.length === PER_KIND ? `los primeros ${PER_KIND}` : group.hits.length}
                </span>
              </h2>
              <Card className="divide-y divide-line/70 p-1.5">
                {group.hits.map((hit) => (
                  <SearchResultRow key={`${hit.kind}-${hit.id}`} hit={hit} query={query} className="rounded-none first:rounded-t-2xl last:rounded-b-2xl" />
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
