import type { Metadata } from "next";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateButton } from "@/components/quick-create/create-button";
import { Card } from "@/components/ui/card";
import { todayISO } from "@/lib/dates";
import {
  DEFAULT_PROJECT_FILTER,
  matchesProjectFilter,
  parseProjectFilter,
  projectFilterQuery,
  sortProjects,
  type ProjectFilter,
} from "@/lib/projects/filters";
import { getProjectSummaries } from "@/lib/projects/queries";
import { PROJECT_STATUSES } from "@/lib/quick-create/constants";
import { cn } from "@/lib/utils";

const CHIPS: { value: ProjectFilter; label: string }[] = [
  { value: "activos", label: "Activos" },
  ...PROJECT_STATUSES.map((status) => ({ value: status.value, label: status.label })),
  { value: "todos", label: "Todos" },
];

export const metadata: Metadata = { title: "Proyectos" };

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filter = parseProjectFilter(await searchParams);
  const today = todayISO();

  const all = await getProjectSummaries();
  const projects = sortProjects(all.filter((project) => matchesProjectFilter(project.status, filter)));

  return (
    <>
      <PageHeader
        title="Proyectos"
        subtitle="Lo que estamos construyendo juntos."
        actions={<CreateButton kind="project" label="Nuevo proyecto" />}
      />

      <nav aria-label="Filtrar proyectos por estado" className="mb-6 flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <Link
            key={chip.value}
            href={`/proyectos${projectFilterQuery(chip.value)}`}
            aria-current={filter === chip.value ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
              filter === chip.value
                ? "border-bordo bg-bordo text-beige shadow-card"
                : "border-line bg-surface text-muted hover:text-ink",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </nav>

      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {projects.length === 1 ? "1 proyecto" : `${projects.length} proyectos`}
      </p>

      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} today={today} />
          ))}
        </div>
      ) : (
        <Card className="mx-auto max-w-xl p-10 text-center">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-bordo-soft text-bordo">
            <Rocket className="size-7" aria-hidden />
          </span>
          <p className="mt-4 font-semibold text-ink">
            {filter === DEFAULT_PROJECT_FILTER ? "No hay proyectos activos." : "No hay proyectos con este estado."}
          </p>
          <p className="mt-1 text-sm text-muted">
            {filter === DEFAULT_PROJECT_FILTER
              ? "Creá uno con el botón de arriba o mirá todos los proyectos."
              : "Probá con otro estado."}
          </p>
          {filter !== "todos" && (
            <Link href="/proyectos?estado=todos" className="mt-3 inline-block text-sm font-semibold text-bordo underline underline-offset-4">
              Ver todos los proyectos
            </Link>
          )}
        </Card>
      )}
    </>
  );
}
