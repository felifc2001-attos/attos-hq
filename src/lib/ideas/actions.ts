"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { parseIdeaInput } from "@/lib/quick-create/validate";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/tasks/types";
import { isUuid } from "@/lib/tasks/validate";

// Editar, eliminar y votar ideas. Crearlas está en lib/quick-create; convertirlas, en createTask / createProject.

const SAVE_ERROR = "No se pudo guardar. Probá de nuevo en unos segundos.";

function fail(error: string, detail?: string): ActionResult {
  if (detail) console.error(`[ideas] ${error} — ${detail}`);
  return { ok: false, error };
}

export async function updateIdea(id: string, raw: unknown): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Idea inválida.");
  const parsed = parseIdeaInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  await getCurrentUser(); // verifica que haya sesión
  const supabase = await createClient();

  const { data: existing } = await supabase.from("ideas").select("id").eq("id", id).maybeSingle();
  if (!existing) return fail("No encontramos la idea. Puede que ya la hayan eliminado.");

  const { error } = await supabase
    .from("ideas")
    .update({ title: input.title, description: input.description || null, area: input.area })
    .eq("id", id);
  if (error) return fail(SAVE_ERROR, error.message);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteIdea(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Idea inválida.");

  await getCurrentUser(); // verifica que haya sesión
  const supabase = await createClient();

  // Lo que se creó a partir de la idea (tarea o proyecto) no se toca.
  const { error } = await supabase.from("ideas").delete().eq("id", id);
  if (error) return fail("No se pudo eliminar la idea. Probá de nuevo.", error.message);

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Votar una idea; si ya la había votado, quita el voto. */
export async function toggleIdeaVote(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Idea inválida.");

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("idea_votes")
    .select("idea_id")
    .eq("idea_id", id)
    .eq("user_id", me.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("idea_votes").delete().eq("idea_id", id).eq("user_id", me.id);
    if (error) return fail("No se pudo quitar el voto. Probá de nuevo.", error.message);
  } else {
    const { error } = await supabase.from("idea_votes").insert({ idea_id: id, user_id: me.id });
    // 23505 = ya estaba votada (doble clic muy rápido): el resultado es el mismo que se buscaba.
    if (error && error.code !== "23505") return fail("No se pudo votar. Probá de nuevo.", error.message);
  }

  revalidatePath("/ideas");
  return { ok: true };
}
