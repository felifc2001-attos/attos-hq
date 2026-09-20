import type { Metadata } from "next";
import { ContentBoard } from "@/components/content/content-board";
import { ContentFilterBar } from "@/components/content/content-filter-bar";
import { NewContentButton } from "@/components/content/new-content-button";
import { DeepLink } from "@/components/layout/deep-link";
import { PageHeader } from "@/components/layout/page-header";
import { todayISO } from "@/lib/dates";
import { applyContentFilters, contentFiltersToQuery, parseContentFilters } from "@/lib/content/filters";
import { getContentById, getContentItems } from "@/lib/content/queries";
import { getPeople, getProjects } from "@/lib/tasks/queries";
import { isUuid } from "@/lib/tasks/validate";

export const metadata: Metadata = { title: "Contenido" };

export default async function ContenidoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseContentFilters(params);
  const linkedId = Array.isArray(params.contenido) ? params.contenido[0] : params.contenido;
  const today = todayISO();

  const [all, people, projects, linked] = await Promise.all([
    getContentItems(today),
    getPeople(),
    getProjects(),
    // Enlace directo (desde una notificación): puede ser una publicación vieja que no está en el tablero.
    isUuid(linkedId) ? getContentById(linkedId) : Promise.resolve(null),
  ]);

  const items = applyContentFilters(all, filters);
  const toApprove = items.filter((item) => item.status === "para_aprobar").length;

  return (
    <>
      <PageHeader
        title="Contenido"
        subtitle="El recorrido de cada publicación, de la idea a publicada."
        actions={<NewContentButton />}
      />

      {linked && <DeepLink content={linked} cleanHref={`/contenido${contentFiltersToQuery(filters)}`} />}
      {linkedId && !linked && (
        <p role="status" className="mb-6 rounded-xl bg-beige-deep/60 px-4 py-3 text-sm text-muted">
          Esa publicación ya no existe. Puede que la hayan eliminado.
        </p>
      )}

      <ContentFilterBar filters={filters} people={people} projects={projects} />

      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {items.length === 1 ? "1 publicación" : `${items.length} publicaciones`}
        {toApprove > 0 && (
          <>
            {" · "}
            <span className="font-semibold text-st-review">
              {toApprove === 1 ? "1 esperando aprobación" : `${toApprove} esperando aprobación`}
            </span>
          </>
        )}
      </p>

      <ContentBoard items={items} today={today} />
    </>
  );
}
