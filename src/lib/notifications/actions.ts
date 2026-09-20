"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/tasks/types";
import { isUuid } from "@/lib/tasks/validate";

// Marcar como leídas y borrar mis notificaciones. Las de otras personas no se pueden tocar:
// además de filtrar por mi id acá, la base lo exige.

function fail(error: string, detail?: string): ActionResult {
  if (detail) console.error(`[notificaciones] ${error} — ${detail}`);
  return { ok: false, error };
}

// El número de la campanita está en el layout, así que se vuelve a leer todo.
function refresh() {
  revalidatePath("/", "layout");
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Notificación inválida.");

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", me.id)
    .is("read_at", null); // si ya estaba leída, se conserva la fecha original
  if (error) return fail("No se pudo marcar como leída. Probá de nuevo.", error.message);

  refresh();
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const me = await getCurrentUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", me.id)
    .is("read_at", null);
  if (error) return fail("No se pudieron marcar como leídas. Probá de nuevo.", error.message);

  refresh();
  return { ok: true };
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Notificación inválida.");

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").delete().eq("id", id).eq("user_id", me.id);
  if (error) return fail("No se pudo borrar la notificación. Probá de nuevo.", error.message);

  refresh();
  return { ok: true };
}
