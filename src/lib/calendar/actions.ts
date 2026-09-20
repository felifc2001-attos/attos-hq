"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/record";
import { getCurrentUser } from "@/lib/auth/session";
import { dateInAR, diffDays, isValidISODate } from "@/lib/dates";
import { parseEventInput } from "@/lib/quick-create/validate";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/tasks/types";
import { isUuid } from "@/lib/tasks/validate";
import { shiftTimestamp } from "./move";

const SAVE_ERROR = "No se pudo guardar. Probá de nuevo en unos segundos.";
// Un movimiento razonable nunca llega a los 10 años; evita fechas absurdas por un pedido manipulado.
const MAX_MOVE_DAYS = 3650;

function fail(error: string, detail?: string): ActionResult {
  if (detail) console.error(`[calendario] ${error} — ${detail}`);
  return { ok: false, error };
}

// Después de tocar un evento o una fecha se vuelve a leer todo lo que lo muestra (Calendario, Inicio, Tareas…).
function refreshEverything() {
  revalidatePath("/", "layout");
}

/**
 * Soltar un elemento del calendario en otro día.
 * Un evento o una publicación se corren la misma cantidad de días (conservan la hora, y el evento su duración);
 * una tarea toma ese día como fecha límite.
 * `fromDay` es el día desde el que se lo arrastró (un evento de varios días se puede agarrar de cualquiera de ellos).
 */
export async function moveCalendarItem(kind: string, id: string, fromDay: string, toDay: string): Promise<ActionResult> {
  if (kind !== "event" && kind !== "task" && kind !== "content") return fail("Eso no se puede mover desde el calendario.");
  if (!isUuid(id)) return fail("Elemento inválido.");
  if (!isValidISODate(fromDay) || !isValidISODate(toDay)) return fail("Fecha inválida.");
  const days = diffDays(toDay, fromDay);
  if (Math.abs(days) > MAX_MOVE_DAYS) return fail("Fecha inválida.");
  if (days === 0) return { ok: true };

  const me = await getCurrentUser();
  const supabase = await createClient();

  if (kind === "task") {
    const { data: before } = await supabase.from("tasks").select("title").eq("id", id).maybeSingle();
    if (!before) return fail("No encontramos la tarea. Puede que ya la hayan eliminado.");

    const { error } = await supabase.from("tasks").update({ due_date: toDay }).eq("id", id);
    if (error) return fail("No se pudo mover la tarea. Probá de nuevo.", error.message);

    await logActivity(supabase, me.id, "actualizo", { type: "task", id, title: before.title as string }, {
      field: "due_date",
      to: toDay,
    });
  } else if (kind === "content") {
    const { data: before } = await supabase.from("content_items").select("title, publish_at").eq("id", id).maybeSingle();
    if (!before) return fail("No encontramos la publicación. Puede que ya la hayan eliminado.");
    if (!before.publish_at) return fail("Esa publicación no tiene fecha.");

    const publishAt = shiftTimestamp(before.publish_at as string, days);
    const { error } = await supabase.from("content_items").update({ publish_at: publishAt }).eq("id", id);
    if (error) return fail("No se pudo mover la publicación. Probá de nuevo.", error.message);

    await logActivity(supabase, me.id, "actualizo", { type: "content_item", id, title: before.title as string }, {
      field: "date",
      to: dateInAR(publishAt),
    });
  } else {
    const { data: before } = await supabase
      .from("calendar_events")
      .select("title, starts_at, ends_at")
      .eq("id", id)
      .maybeSingle();
    if (!before) return fail("No encontramos el evento. Puede que ya lo hayan eliminado.");

    const startsAt = shiftTimestamp(before.starts_at as string, days);
    const endsAt = before.ends_at ? shiftTimestamp(before.ends_at as string, days) : null;
    const { error } = await supabase.from("calendar_events").update({ starts_at: startsAt, ends_at: endsAt }).eq("id", id);
    if (error) return fail("No se pudo mover el evento. Probá de nuevo.", error.message);

    await logActivity(supabase, me.id, "actualizo", { type: "calendar_event", id, title: before.title as string }, {
      field: "date",
      to: dateInAR(startsAt),
    });
  }

  refreshEverything();
  return { ok: true };
}

export async function updateEvent(id: string, raw: unknown): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Evento inválido.");
  const parsed = parseEventInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data: before } = await supabase.from("calendar_events").select("starts_at").eq("id", id).maybeSingle();
  if (!before) return fail("No encontramos el evento. Puede que ya lo hayan eliminado.");

  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: input.title,
      description: input.description || null,
      category: input.category,
      kind: input.kind,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      all_day: input.allDay,
      project_id: input.projectId,
    })
    .eq("id", id);
  if (error) return fail(SAVE_ERROR, error.message);

  const newDay = dateInAR(input.startsAt);
  const movedDay = newDay !== dateInAR(before.starts_at as string);
  await logActivity(
    supabase,
    me.id,
    "actualizo",
    { type: "calendar_event", id, title: input.title },
    movedDay ? { field: "date", to: newDay } : {},
  );

  refreshEverything();
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Evento inválido.");

  await getCurrentUser(); // verifica que haya sesión
  const supabase = await createClient();

  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return fail("No se pudo eliminar. Probá de nuevo en unos segundos.", error.message);

  refreshEverything();
  return { ok: true };
}
