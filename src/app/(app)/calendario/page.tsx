import type { Metadata } from "next";
import { CalendarBoard } from "@/components/calendar/calendar-board";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { CreateButton } from "@/components/quick-create/create-button";
import { applyCalendarFilters, contentToItem, eventToItem, taskToItem } from "@/lib/calendar/items";
import { parseCalendarParams } from "@/lib/calendar/params";
import { getCalendarData } from "@/lib/calendar/queries";
import { periodLabel, visibleRange } from "@/lib/calendar/range";
import type { CalendarItem } from "@/lib/calendar/types";
import { todayISO } from "@/lib/dates";

export const metadata: Metadata = { title: "Calendario" };

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const today = todayISO();
  const state = parseCalendarParams(await searchParams, today);

  const { from, to } = visibleRange(state.view, state.date);
  const data = await getCalendarData(from, to);

  const items = applyCalendarFilters(
    [
      ...data.events.map(eventToItem),
      ...data.tasks.flatMap((task) => taskToItem(task) ?? []),
      ...data.content.flatMap((content) => contentToItem(content) ?? []),
    ] satisfies CalendarItem[],
    state,
  );

  return (
    <>
      <PageHeader
        title="Calendario"
        subtitle="Fechas, entregas y eventos del equipo."
        actions={<CreateButton kind="event" label="Nuevo evento" />}
      />

      <CalendarToolbar state={state} today={today} label={periodLabel(state.view, state.date)} />

      {/* Al cambiar de mes o de semana se vuelve a armar, así la selección del día arranca de cero. */}
      <CalendarBoard key={`${state.view}-${state.date}`} state={state} today={today} items={items} />
    </>
  );
}
