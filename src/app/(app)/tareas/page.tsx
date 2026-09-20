import type { Metadata } from "next";
import Link from "next/link";
import { SquareCheckBig } from "lucide-react";
import { DeepLink } from "@/components/layout/deep-link";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { TaskFilterBar } from "@/components/tasks/task-filter-bar";
import { TaskRow } from "@/components/tasks/task-row";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { todayISO } from "@/lib/dates";
import { DEFAULT_FILTERS, filtersToQuery, hasActiveFilters, parseFilters } from "@/lib/tasks/filters";
import { getPeople, getProjects, getTaskById, getTasks } from "@/lib/tasks/queries";
import { isUuid } from "@/lib/tasks/validate";

export const metadata: Metadata = { title: "Tareas" };

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const linkedId = Array.isArray(params.tarea) ? params.tarea[0] : params.tarea;
  const me = await getCurrentUser();
  const today = todayISO();

  const [tasks, people, projects, linked] = await Promise.all([
    getTasks(filters, me.id, today),
    getPeople(),
    getProjects(),
    // Enlace directo (desde una notificación): se abre esa tarea sobre la lista.
    isUuid(linkedId) ? getTaskById(linkedId) : Promise.resolve(null),
  ]);

  const filtered = hasActiveFilters(filters);

  return (
    <>
      <PageHeader
        title="Tareas"
        subtitle="Todo lo que hay que hacer en ATTOS."
        actions={<NewTaskButton />}
      />

      {linked && <DeepLink task={linked} cleanHref={`/tareas${filtersToQuery(filters)}`} />}
      {linkedId && !linked && (
        <p role="status" className="mb-6 rounded-xl bg-beige-deep/60 px-4 py-3 text-sm text-muted">
          Esa tarea ya no existe. Puede que la hayan eliminado.
        </p>
      )}

      <TaskFilterBar filters={filters} people={people} projects={projects} />

      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {tasks.length === 1 ? "1 tarea" : `${tasks.length} tareas`}
      </p>

      {filters.view === "kanban" ? (
        <KanbanBoard tasks={tasks} today={today} />
      ) : tasks.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-line">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} today={today} showAssignee={filters.scope === "todas"} />
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="mx-auto max-w-xl p-10 text-center">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-bordo-soft text-bordo">
            <SquareCheckBig className="size-7" aria-hidden />
          </span>
          {filtered ? (
            <>
              <p className="mt-4 font-semibold text-ink">No hay tareas con estos filtros.</p>
              <Link
                href={`/tareas${filtersToQuery({ ...DEFAULT_FILTERS, scope: filters.scope, view: filters.view })}`}
                className="mt-2 inline-block text-sm font-semibold text-bordo underline underline-offset-4"
              >
                Limpiar filtros
              </Link>
            </>
          ) : (
            <>
              <p className="mt-4 font-semibold text-ink">
                {filters.scope === "mias" ? "No tenés tareas pendientes." : "Todavía no hay tareas."}
              </p>
              <p className="mt-1 text-sm text-muted">Creá una con el botón de arriba.</p>
            </>
          )}
        </Card>
      )}
    </>
  );
}
