import type { Metadata } from "next";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { IdeaCard } from "@/components/ideas/idea-card";
import { IdeaFilterBar } from "@/components/ideas/idea-filter-bar";
import { DeepLink } from "@/components/layout/deep-link";
import { PageHeader } from "@/components/layout/page-header";
import { CreateButton } from "@/components/quick-create/create-button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { applyIdeaFilters, hasActiveIdeaFilters, ideaFiltersToQuery, parseIdeaFilters } from "@/lib/ideas/filters";
import { getIdeas } from "@/lib/ideas/queries";

export const metadata: Metadata = { title: "Ideas" };

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseIdeaFilters(params);
  const linkedId = Array.isArray(params.idea) ? params.idea[0] : params.idea;
  const me = await getCurrentUser();

  const all = await getIdeas(me.id);
  const ideas = applyIdeaFilters(all, filters);
  // Enlace directo (desde una notificación): se busca entre todas, aunque los filtros la oculten.
  const linked = linkedId ? (all.find((idea) => idea.id === linkedId) ?? null) : null;

  return (
    <>
      <PageHeader
        title="Ideas"
        subtitle="Que ninguna buena idea se pierda."
        actions={<CreateButton kind="idea" label="Nueva idea" />}
      />

      {linked && <DeepLink idea={linked} cleanHref={`/ideas${ideaFiltersToQuery(filters)}`} />}
      {linkedId && !linked && (
        <p role="status" className="mb-6 rounded-xl bg-beige-deep/60 px-4 py-3 text-sm text-muted">
          Esa idea ya no existe. Puede que la hayan eliminado.
        </p>
      )}

      <IdeaFilterBar filters={filters} />

      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {ideas.length === 1 ? "1 idea" : `${ideas.length} ideas`}
      </p>

      {ideas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : (
        <Card className="mx-auto max-w-xl p-10 text-center">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-bordo-soft text-bordo">
            <Lightbulb className="size-7" aria-hidden />
          </span>
          {hasActiveIdeaFilters(filters) ? (
            <>
              <p className="mt-4 font-semibold text-ink">No hay ideas con estos filtros.</p>
              <Link href="/ideas" className="mt-2 inline-block text-sm font-semibold text-bordo underline underline-offset-4">
                Limpiar filtros
              </Link>
            </>
          ) : (
            <>
              <p className="mt-4 font-semibold text-ink">Todavía no hay ideas abiertas.</p>
              <p className="mt-1 text-sm text-muted">Sumá la primera con el botón de arriba.</p>
            </>
          )}
        </Card>
      )}
    </>
  );
}
