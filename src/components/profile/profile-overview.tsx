import Link from "next/link";
import { Clock, Handshake, Rocket, SquareCheckBig, Trophy, type LucideIcon } from "lucide-react";
import { TaskRow } from "@/components/tasks/task-row";
import { PersonAvatar } from "@/components/ui/avatar";
import { Card, CardTitle } from "@/components/ui/card";
import { describeActivity } from "@/lib/activity/describe";
import { formatRelativeTime } from "@/lib/dates";
import type { ProfileOverview } from "@/lib/profile/types";
import { PROJECT_STATUSES } from "@/lib/quick-create/constants";
import { cn } from "@/lib/utils";

interface Stat {
  one: string;
  many: string;
  value: number;
  icon: LucideIcon;
  alert?: boolean;
}

/** Los números, las tareas, los proyectos y la actividad reciente de una persona. */
export function ProfileOverviewView({ overview, today }: { overview: ProfileOverview; today: string }) {
  const { profile, stats, tasks, projects, activity } = overview;
  const firstName = profile.fullName.split(" ")[0];

  const cards: Stat[] = [
    { one: "tarea abierta", many: "tareas abiertas", value: stats.openTasks, icon: SquareCheckBig },
    { one: "tarea vencida", many: "tareas vencidas", value: stats.overdueTasks, icon: Clock, alert: stats.overdueTasks > 0 },
    { one: "hecha esta semana", many: "hechas esta semana", value: stats.doneThisWeek, icon: Trophy },
    { one: "proyecto activo", many: "proyectos activos", value: stats.activeProjects, icon: Rocket },
    { one: "pedido pendiente", many: "pedidos pendientes", value: stats.pendingRequests, icon: Handshake },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map(({ one, many, value, icon: Icon, alert }) => (
          <Card key={many} className="p-4 sm:p-5">
            <span
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-xl",
                alert ? "bg-prio-urgent/12 text-prio-urgent" : "bg-bordo-soft text-bordo",
              )}
            >
              <Icon className="size-[1.15rem]" aria-hidden />
            </span>
            <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
            <p className="text-sm text-muted">{value === 1 ? one : many}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden p-0 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3 px-6 pb-2 pt-6">
            <CardTitle>Tareas abiertas</CardTitle>
            <Link
              href={`/tareas?vista=todas&persona=${profile.id}`}
              className="text-sm font-semibold text-bordo hover:text-bordo-dark"
            >
              Ver todas
            </Link>
          </div>
          {tasks.length > 0 ? (
            <ul className="divide-y divide-line/70">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} today={today} showAssignee={false} />
              ))}
            </ul>
          ) : (
            <p className="px-6 pb-6 pt-2 text-sm text-muted">{firstName} no tiene tareas abiertas.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Proyectos activos</CardTitle>
          {projects.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link href={`/proyectos/${project.id}`} className="text-sm font-semibold text-ink transition hover:text-bordo">
                    {project.name}
                  </Link>
                  <p className="text-xs text-muted">{PROJECT_STATUSES.find((status) => status.value === project.status)?.label}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">{firstName} no participa en proyectos activos.</p>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <CardTitle>Actividad reciente</CardTitle>
          {activity.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {activity.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <PersonAvatar person={item.actor} size="sm" />
                  <p className="min-w-0 flex-1 text-sm text-ink">
                    <strong className="font-semibold">{firstName}</strong>{" "}
                    {describeActivity(item.action, item.metadata, item.entityTitle)}.
                  </p>
                  <span className="shrink-0 text-xs text-muted">{formatRelativeTime(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Todavía no hay actividad de {firstName}.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
