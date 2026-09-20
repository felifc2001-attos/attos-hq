import Link from "next/link";
import { CalendarDays, Clock, Eye, Handshake, Rocket, SquareCheckBig, type LucideIcon } from "lucide-react";
import { Greeting } from "@/components/layout/greeting";
import { RequestActions } from "@/components/home/request-actions";
import { TaskRow } from "@/components/tasks/task-row";
import { PersonAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { describeActivity } from "@/lib/activity/describe";
import { getRecentActivity } from "@/lib/activity/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDueLabel, formatRelativeTime, formatWeekdayShort, todayISO } from "@/lib/dates";
import { getHomeData } from "@/lib/home/queries";
import { PROJECT_STATUSES } from "@/lib/quick-create/constants";
import { cn } from "@/lib/utils";

interface Stat {
  one: string;
  many: string;
  value: number;
  icon: LucideIcon;
  href: string;
  alert?: boolean;
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const today = todayISO();
  const [home, activity] = await Promise.all([getHomeData(user.id, today), getRecentActivity(8)]);

  const stats: Stat[] = [
    { one: "tarea para hoy", many: "tareas para hoy", value: home.stats.today, icon: SquareCheckBig, href: "/mi-dia" },
    {
      one: "tarea vencida",
      many: "tareas vencidas",
      value: home.stats.overdue,
      icon: Clock,
      href: "/mi-dia",
      alert: home.stats.overdue > 0,
    },
    { one: "esperando revisión", many: "esperando revisión", value: home.stats.review, icon: Eye, href: "/mi-dia" },
    { one: "proyecto activo", many: "proyectos activos", value: home.stats.projects, icon: Rocket, href: "/proyectos" },
    { one: "pedido para vos", many: "pedidos para vos", value: home.stats.requests, icon: Handshake, href: "#pedidos" },
  ];

  return (
    <>
      <Greeting name={user.name} />

      <p className="mb-6 text-muted">Esto es lo que tenés hoy y lo que pasa en ATTOS.</p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ one, many, value, icon: Icon, href, alert }) => (
          <Link key={many} href={href} className="block rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bordo">
            <Card interactive className="h-full p-4 sm:p-5">
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
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden p-0 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3 px-6 pb-2 pt-6">
            <CardTitle>Hoy</CardTitle>
            <Link href="/mi-dia" className="text-sm font-semibold text-bordo hover:text-bordo-dark">
              Ver Mi día
            </Link>
          </div>
          {home.todayTasks.length > 0 ? (
            <ul className="divide-y divide-line/70">
              {home.todayTasks.map((task) => (
                <TaskRow key={task.id} task={task} today={today} showAssignee={false} />
              ))}
            </ul>
          ) : (
            <p className="px-6 pb-6 pt-2 text-sm text-muted">
              No tenés tareas para hoy.
              {home.stats.overdue > 0 && (
                <>
                  {" "}
                  Pero hay {home.stats.overdue === 1 ? "1 vencida" : `${home.stats.overdue} vencidas`}:{" "}
                  <Link href="/mi-dia" className="font-semibold text-bordo underline underline-offset-4">
                    revisalas en Mi día
                  </Link>
                  .
                </>
              )}
            </p>
          )}
        </Card>

        <Card>
          <CardTitle>Proyectos activos</CardTitle>
          {home.projects.length > 0 ? (
            <ul className="mt-4 space-y-5">
              {home.projects.slice(0, 5).map((project) => (
                <li key={project.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <Link href={`/proyectos/${project.id}`} className="min-w-0 truncate text-sm font-semibold text-ink transition hover:text-bordo">
                      {project.name}
                    </Link>
                    <span className="shrink-0 text-sm font-semibold text-bordo">{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} label={project.name} />
                  <p className="mt-1.5 text-xs text-muted">
                    {PROJECT_STATUSES.find((status) => status.value === project.status)?.label}
                    {project.targetDate && ` · objetivo ${formatDueLabel(project.targetDate, today).toLowerCase()}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Todavía no hay proyectos activos. Creá uno con el botón +.</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <CardTitle>Esta semana</CardTitle>
            <Link href="/calendario" className="text-sm font-semibold text-bordo hover:text-bordo-dark">
              Ver calendario
            </Link>
          </div>
          {home.week.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {home.week.map((item) => (
                <li key={item.key} className="flex items-center gap-4">
                  <span className="w-12 shrink-0 rounded-xl bg-beige py-2 text-center text-xs font-bold uppercase tracking-wide text-bordo">
                    {item.date === today ? "Hoy" : formatWeekdayShort(item.date)}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                    {item.time && <span className="mr-1.5 font-semibold text-muted">{item.time}</span>}
                    {item.title}
                    <span className="ml-2 inline-flex translate-y-0.5 items-center text-muted">
                      {item.kind === "event" ? (
                        <CalendarDays className="size-3.5" aria-label="Evento" />
                      ) : (
                        <SquareCheckBig className="size-3.5" aria-label="Tarea" />
                      )}
                    </span>
                  </span>
                  <PersonAvatar person={item.person} size="sm" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No hay eventos ni tareas con fecha en los próximos 7 días.</p>
          )}
        </Card>

        <Card id="pedidos" className="scroll-mt-24">
          <div className="flex items-baseline justify-between gap-3">
            <CardTitle>Pedidos pendientes</CardTitle>
            <Link href="/pedidos" className="text-sm font-semibold text-bordo hover:text-bordo-dark">
              Ver todos
            </Link>
          </div>
          {home.requests.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {home.requests.map((request) => (
                <li key={request.id} className="flex items-start gap-3">
                  <PersonAvatar person={request.other} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{request.title}</p>
                    <p className="text-xs text-muted">
                      {request.direction === "incoming" ? "Te lo pide" : "Le pedís a"} {request.other?.fullName ?? "alguien"}
                      {request.dueDate && ` · ${formatDueLabel(request.dueDate, today).toLowerCase()}`}
                    </p>
                    <Badge tone={request.direction === "incoming" ? "high" : "todo"} className="mt-1.5">
                      {request.direction === "incoming" ? "Te toca a vos" : "Esperando"}
                    </Badge>
                  </div>
                  <RequestActions id={request.id} direction={request.direction} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">
              No hay pedidos pendientes. Si necesitás algo de alguien, usá &ldquo;Necesito de…&rdquo; en el botón +.
            </p>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <CardTitle>Actividad del equipo</CardTitle>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Todavía no hay actividad. Cuando alguien cree, mueva o comente algo, aparece acá.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {activity.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <PersonAvatar person={item.actor} size="sm" />
                  <p className="min-w-0 flex-1 text-sm text-ink">
                    <strong className="font-semibold">{item.actor?.fullName ?? "Alguien"}</strong>{" "}
                    {describeActivity(item.action, item.metadata, item.entityTitle)}.
                  </p>
                  <span className="shrink-0 text-xs text-muted">{formatRelativeTime(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
