import type { Metadata } from "next";
import { DeepLink } from "@/components/layout/deep-link";
import { PageHeader } from "@/components/layout/page-header";
import { IssueBoard } from "@/components/issues/issue-board";
import { IssueFilterBar } from "@/components/issues/issue-filter-bar";
import { CreateButton } from "@/components/quick-create/create-button";
import { getCurrentUser } from "@/lib/auth/session";
import { todayISO } from "@/lib/dates";
import { RESOLVED_STATUS } from "@/lib/issues/constants";
import {
  ISSUE_VIEWS,
  applyIssueFilters,
  isInTray,
  issueFiltersToQuery,
  parseIssueFilters,
  type IssueFilters,
} from "@/lib/issues/filters";
import { getIssueById, getIssues } from "@/lib/issues/queries";
import { isUuid } from "@/lib/tasks/validate";

export const metadata: Metadata = { title: "Sistemas" };

export default async function SistemasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseIssueFilters(params);
  const linkedId = Array.isArray(params.problema) ? params.problema[0] : params.problema;
  const me = await getCurrentUser();
  const today = todayISO();

  const [all, linked] = await Promise.all([
    getIssues(today),
    // Enlace directo (desde una notificación): puede ser un problema viejo que no está en el tablero.
    isUuid(linkedId) ? getIssueById(linkedId) : Promise.resolve(null),
  ]);

  const issues = applyIssueFilters(all, filters, me.id);
  // Cuántos hay en cada pestaña, con el mismo tipo y prioridad elegidos.
  const counts = Object.fromEntries(
    ISSUE_VIEWS.map((option) => [option.value, applyIssueFilters(all, { ...filters, view: option.value }, me.id).length]),
  ) as Record<IssueFilters["view"], number>;

  const open = all.filter((issue) => issue.status !== RESOLVED_STATUS).length;
  const inTray = all.filter(isInTray).length;

  return (
    <>
      <PageHeader
        title="Sistemas"
        subtitle="Problemas, mejoras y novedades del sistema de pedidos."
        actions={<CreateButton kind="issue" label="Reportar problema" />}
      />

      {linked && <DeepLink issue={linked} cleanHref={`/sistemas${issueFiltersToQuery(filters)}`} />}
      {linkedId && !linked && (
        <p role="status" className="mb-6 rounded-xl bg-beige-deep/60 px-4 py-3 text-sm text-muted">
          Ese problema ya no existe. Puede que lo hayan eliminado.
        </p>
      )}

      <IssueFilterBar filters={filters} counts={counts} />

      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {open === 1 ? "1 abierto" : `${open} abiertos`}
        {inTray > 0 && (
          <>
            {" · "}
            <span className="font-semibold text-bordo">
              {inTray === 1 ? "1 esperando en la bandeja" : `${inTray} esperando en la bandeja`}
            </span>
          </>
        )}
      </p>

      <IssueBoard issues={issues} />
    </>
  );
}
