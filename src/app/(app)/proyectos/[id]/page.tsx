import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Flag } from "lucide-react";
import { EntityActivity } from "@/components/comments/entity-activity";
import { EntityComments } from "@/components/comments/entity-comments";
import { EditProjectButton } from "@/components/projects/edit-project-button";
import { ProjectStatusBadge } from "@/components/projects/status-badge";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { TaskRow } from "@/components/tasks/task-row";
import { PersonAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getCurrentUser } from "@/lib/auth/session";
import { formatShortDate, todayISO } from "@/lib/dates";
import { groupTasksByPerson } from "@/lib/projects/group";
import { getProjectSummary } from "@/lib/projects/queries";
import type { EditableProject } from "@/lib/projects/types";
import { DEFAULT_FILTERS } from "@/lib/tasks/filters";
import { getTasks } from "@/lib/tasks/queries";
import { isUuid } from "@/lib/tasks/validate";
import { cn } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const me = await getCurrentUser();
  const today = todayISO();

  const [project, tasks] = await Promise.all([
    getProjectSummary(id),
    // Todas las tareas del proyecto, también las terminadas.
    getTasks({ ...DEFAULT_FILTERS, scope: "todas", project: id, showDone: true }, me.id, today),
  ]);
  if (!project) notFound();

  const groups = groupTasksByPerson(tasks);
  const late = project.status !== "finalizado" && project.targetDate !== null && project.targetDate < today;

  const editable: EditableProject = {
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    status: project.status,
    ownerId: project.owner?.id ?? null,
    startDate: project.startDate,
    targetDate: project.targetDate,
    memberIds: project.members.map((member) => member.id),
  };

  return (
    <>
      <Link href="/proyectos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-bordo">
        <ArrowLeft className="size-4" aria-hidden />
        Proyectos
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <ProjectStatusBadge status={project.status} />
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">{project.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <EditProjectButton project={editable} />
          <NewTaskButton label="Nueva tarea" defaults={{ projectId: project.id }} />
        </div>
      </div>

      <Card className="mb-8 p-5 sm:p-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="font-semibold text-ink">
            {project.taskCount === 0
              ? "Todavía no hay tareas en este proyecto"
              : `${project.doneCount} de ${project.taskCount} ${project.taskCount === 1 ? "tarea lista" : "tareas listas"}`}
          </p>
          <p className="font-display text-2xl font-semibold text-bordo">{project.progress}%</p>
        </div>
        <ProgressBar value={project.progress} label={`Progreso de ${project.name}`} />

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Responsable</dt>
            <dd className="mt-1.5 flex items-center gap-2 font-medium text-ink">
              {project.owner ? (
                <>
                  <PersonAvatar person={project.owner} size="sm" />
                  {project.owner.fullName}
                </>
              ) : (
                <span className="text-muted">Sin responsable</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Participan</dt>
            <dd className="mt-1.5 flex items-center -space-x-2">
              {project.members.map((member) => (
                <PersonAvatar key={member.id} person={member} size="sm" />
              ))}
              {project.members.length === 0 && <span className="text-muted">Nadie todavía</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Fechas</dt>
            <dd className="mt-1.5 space-y-1 font-medium text-ink">
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted" aria-hidden />
                {project.startDate ? `Inicio: ${formatShortDate(project.startDate)}` : "Sin fecha de inicio"}
              </span>
              <span className={cn("flex items-center gap-2", late && "text-prio-urgent")}>
                <Flag className="size-4" aria-hidden />
                {project.targetDate
                  ? `${late ? "Vencía el" : "Objetivo:"} ${formatShortDate(project.targetDate)}`
                  : "Sin fecha objetivo"}
              </span>
            </dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2" aria-labelledby="project-tasks">
          <h2 id="project-tasks" className="font-display text-xl font-semibold text-ink">
            Tareas por persona
          </h2>

          {groups.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="font-semibold text-ink">Este proyecto todavía no tiene tareas.</p>
              <p className="mb-4 mt-1 text-sm text-muted">Creá la primera y va a aparecer acá, agrupada por persona.</p>
              <NewTaskButton label="Nueva tarea" defaults={{ projectId: project.id }} />
            </Card>
          ) : (
            groups.map((group) => (
              <Card key={group.person?.id ?? "sin-asignar"} className="overflow-hidden p-0">
                <div className="flex items-center gap-3 border-b border-line px-5 py-3">
                  <PersonAvatar person={group.person} size="sm" />
                  <h3 className="font-semibold text-ink">{group.person?.fullName ?? "Sin asignar"}</h3>
                  <Badge className="ml-auto">
                    {group.open.length === 1 ? "1 pendiente" : `${group.open.length} pendientes`}
                  </Badge>
                </div>

                {group.open.length > 0 && (
                  <ul className="divide-y divide-line">
                    {group.open.map((task) => (
                      <TaskRow key={task.id} task={task} today={today} showAssignee={false} />
                    ))}
                  </ul>
                )}

                {group.done.length > 0 && (
                  <details className={cn(group.open.length > 0 && "border-t border-line")}>
                    <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-muted hover:text-ink">
                      Completadas ({group.done.length})
                    </summary>
                    <ul className="divide-y divide-line border-t border-line">
                      {group.done.map((task) => (
                        <TaskRow key={task.id} task={task} today={today} showAssignee={false} />
                      ))}
                    </ul>
                  </details>
                )}
              </Card>
            ))
          )}
        </section>

        <div className="space-y-6">
          {project.description && (
            <Card>
              <CardTitle>Sobre el proyecto</CardTitle>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{project.description}</p>
            </Card>
          )}

          <Card>
            <CardTitle>Comentarios</CardTitle>
            <div className="mt-3">
              <EntityComments entityType="project" entityId={project.id} listClassName="max-h-96" />
            </div>
          </Card>

          <Card>
            <CardTitle>Historial</CardTitle>
            <div className="mt-3">
              <EntityActivity entityType="project" entityId={project.id} listClassName="max-h-80" />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
