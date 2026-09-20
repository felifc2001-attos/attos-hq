import type { Metadata } from "next";
import { CalendarClock, Clock, Eye, Flame, Lock, PartyPopper } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DaySection } from "@/components/tasks/day-section";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getCurrentUser } from "@/lib/auth/session";
import { formatLongDate, todayISO } from "@/lib/dates";
import { bucketMyDay } from "@/lib/tasks/my-day";
import { getMyDayData } from "@/lib/tasks/queries";

export const metadata: Metadata = { title: "Mi día" };

export default async function MiDiaPage() {
  const me = await getCurrentUser();
  const today = todayISO();

  const { open, reviewCandidates, doneToday } = await getMyDayData(me.id, today);
  const day = bucketMyDay(open, reviewCandidates, today);

  // El progreso del día: lo que ya terminé hoy sobre lo que tenía que hacer (hoy + vencidas).
  const remaining = day.today.length + day.overdue.length;
  const total = doneToday + remaining;
  const nothingToDo = remaining === 0 && day.review.length === 0;

  return (
    <>
      <PageHeader
        title="Mi día"
        subtitle={`${formatLongDate(today)} · Solo lo que importa hoy para vos.`}
        actions={<NewTaskButton />}
      />

      {total > 0 && (
        <Card className="mb-8 p-5 sm:p-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="font-semibold text-ink">
              {remaining === 0
                ? "¡Terminaste todo lo de hoy!"
                : `Te ${remaining === 1 ? "queda 1 tarea" : `quedan ${remaining} tareas`} por hacer`}
            </p>
            <p className="shrink-0 text-sm text-muted">
              {doneToday} de {total} completadas
            </p>
          </div>
          <ProgressBar value={(doneToday / total) * 100} label="Progreso del día" />
        </Card>
      )}

      <div className="space-y-8">
        <DaySection
          title="Prioridades de hoy"
          hint="Lo que vence hoy, lo más importante primero."
          icon={Flame}
          iconClassName="bg-bordo-soft text-bordo"
          tasks={day.today}
          today={today}
        />
        <DaySection
          title="Vencidas"
          hint="Ya pasó la fecha: conviene resolverlas primero."
          icon={Clock}
          iconClassName="bg-prio-urgent/10 text-prio-urgent"
          tasks={day.overdue}
          today={today}
        />
        <DaySection
          title="Esperando revisión"
          hint="Tuyas en revisión, o de otros que te toca revisar."
          icon={Eye}
          iconClassName="bg-st-review/14 text-st-review"
          tasks={day.review}
          today={today}
          showAssignee
        />
        <DaySection
          title="Próximas"
          hint="Vencen en los próximos 7 días."
          icon={CalendarClock}
          iconClassName="bg-st-doing/12 text-st-doing"
          tasks={day.upcoming}
          today={today}
        />
        <DaySection
          title="Bloqueadas"
          hint="Esperan algo de otra persona antes de poder avanzar."
          icon={Lock}
          iconClassName="bg-prio-high/14 text-prio-high"
          tasks={day.blocked}
          today={today}
        />

        {nothingToDo && (
          <Card className="mx-auto max-w-xl p-10 text-center">
            <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-bordo-soft text-bordo">
              <PartyPopper className="size-7" aria-hidden />
            </span>
            <p className="mt-4 font-semibold text-ink">
              {doneToday > 0 ? "¡Día despejado! Ya hiciste todo lo de hoy." : "No tenés nada urgente para hoy."}
            </p>
            <p className="mt-1 text-sm text-muted">Podés revisar lo que viene en Tareas o crear una nueva.</p>
          </Card>
        )}
      </div>
    </>
  );
}
