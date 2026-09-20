import "server-only";

import { getContentBetween } from "@/lib/content/queries";
import type { ContentItem } from "@/lib/content/types";
import { addDays, arToISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { getTasksDueBetween } from "@/lib/tasks/queries";
import type { Task } from "@/lib/tasks/types";
import type { EventRow } from "./types";

export interface CalendarData {
  events: EventRow[];
  tasks: Task[];
  content: ContentItem[];
}

const EVENT_SELECT =
  "id, title, description, category, kind, starts_at, ends_at, all_day, project_id, creator:profiles!created_by(id, full_name, color)";

/** Todo lo que cae entre dos días (ambos incluidos): eventos, tareas con fecha límite y publicaciones programadas. */
export async function getCalendarData(from: string, to: string): Promise<CalendarData> {
  const supabase = await createClient();
  // Argentina no usa horario de verano: el día empieza siempre a las 00:00 (UTC-3).
  const fromAt = arToISO(from);
  const toAt = arToISO(addDays(to, 1)); // el día siguiente a las 00:00, no incluido

  const [events, content, tasks] = await Promise.all([
    supabase
      .from("calendar_events")
      .select(EVENT_SELECT)
      .lt("starts_at", toAt)
      // Un evento de varios días que empezó antes también se ve: alcanza con que termine dentro del rango.
      .or(`starts_at.gte.${fromAt},ends_at.gte.${fromAt}`)
      .order("starts_at")
      .limit(400),
    getContentBetween(from, to),
    getTasksDueBetween(from, to),
  ]);

  if (events.error) throw new Error(`No se pudo cargar el calendario: ${events.error.message}`);

  return { events: (events.data ?? []) as unknown as EventRow[], content, tasks };
}
