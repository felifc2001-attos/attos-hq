"use server";

import { revalidatePath } from "next/cache";
import { logActivity, sendNotification } from "@/lib/activity/record";
import { getCurrentUser } from "@/lib/auth/session";
import { parseProjectInput } from "@/lib/quick-create/validate";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/tasks/types";
import { isUuid } from "@/lib/tasks/validate";

// Editar y eliminar proyectos. Crearlos está en lib/quick-create (también sirve para convertir ideas).

const SAVE_ERROR = "No se pudo guardar. Probá de nuevo en unos segundos.";

function fail(error: string, detail?: string): ActionResult {
  if (detail) console.error(`[proyectos] ${error} — ${detail}`);
  return { ok: false, error };
}

export async function updateProject(id: string, raw: unknown): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Proyecto inválido.");
  const parsed = parseProjectInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data: before } = await supabase.from("projects").select("status").eq("id", id).maybeSingle();
  if (!before) return fail("No encontramos el proyecto. Puede que ya lo hayan eliminado.");

  const { error } = await supabase
    .from("projects")
    .update({
      name: input.name,
      description: input.description || null,
      owner_id: input.ownerId,
      status: input.status,
      start_date: input.startDate,
      target_date: input.targetDate,
    })
    .eq("id", id);
  if (error) return fail(SAVE_ERROR, error.message);

  const entity = { type: "project" as const, id, title: input.name };
  if (input.status !== before.status) {
    await logActivity(supabase, me.id, "movio", entity, { from: before.status as string, to: input.status });
  }

  // Integrantes: se suman los nuevos y se sacan los destildados. El responsable siempre participa.
  const { data: current, error: membersError } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", id);
  if (membersError) return fail(SAVE_ERROR, membersError.message);

  const currentIds = new Set((current ?? []).map((row) => row.user_id as string));
  const wanted = new Set([...input.memberIds, ...(input.ownerId ? [input.ownerId] : [])]);
  const toAdd = [...wanted].filter((userId) => !currentIds.has(userId));
  const toRemove = [...currentIds].filter((userId) => !wanted.has(userId));

  if (toAdd.length > 0) {
    const { error: addError } = await supabase
      .from("project_members")
      .insert(toAdd.map((userId) => ({ project_id: id, user_id: userId })));
    if (addError) return fail(SAVE_ERROR, addError.message);
    for (const userId of toAdd) {
      if (userId === me.id) continue;
      await sendNotification(supabase, {
        userId,
        actorId: me.id,
        type: "asignacion",
        entity,
        message: `${me.name} te sumó al proyecto: ${input.name}.`,
      });
    }
  }
  if (toRemove.length > 0) {
    const { error: removeError } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", id)
      .in("user_id", toRemove);
    if (removeError) return fail(SAVE_ERROR, removeError.message);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Las tareas del proyecto no se borran: quedan sin proyecto. */
export async function deleteProject(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Proyecto inválido.");

  await getCurrentUser(); // verifica que haya sesión
  const supabase = await createClient();

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return fail("No se pudo eliminar el proyecto. Probá de nuevo.", error.message);

  revalidatePath("/", "layout");
  return { ok: true };
}
