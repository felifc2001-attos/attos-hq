import "server-only";

import { logActivity } from "@/lib/activity/record";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Convertir una idea en tarea o proyecto: se crea lo nuevo (en createTask / createProject)
// y la idea queda marcada con en qué se convirtió. Una idea se convierte una sola vez.

/** Antes de crear: ¿la idea existe y todavía no fue convertida? */
export async function checkIdeaConvertible(
  supabase: Supabase,
  ideaId: string,
): Promise<{ ok: true; title: string } | { ok: false; error: string }> {
  const { data: idea } = await supabase
    .from("ideas")
    .select("title, converted_task_id, converted_project_id")
    .eq("id", ideaId)
    .maybeSingle();
  if (!idea) return { ok: false, error: "No encontramos la idea. Puede que ya la hayan eliminado." };
  if (idea.converted_task_id || idea.converted_project_id) {
    return { ok: false, error: "Esa idea ya se convirtió en otra cosa." };
  }
  return { ok: true, title: idea.title as string };
}

/** Después de crear: la idea queda enlazada con lo que se creó y se anota en su historial. */
export async function markIdeaConverted(
  supabase: Supabase,
  actorId: string,
  idea: { id: string; title: string },
  target: { kind: "task" | "project"; id: string },
) {
  const column = target.kind === "task" ? "converted_task_id" : "converted_project_id";
  const { error } = await supabase
    .from("ideas")
    .update({ [column]: target.id })
    .eq("id", idea.id)
    // Si otra persona la convirtió justo antes, no se pisa.
    .is("converted_task_id", null)
    .is("converted_project_id", null);
  if (error) {
    console.error("[ideas] No se pudo marcar como convertida:", error.message);
    return;
  }

  await logActivity(
    supabase,
    actorId,
    "actualizo",
    { type: "idea", id: idea.id, title: idea.title },
    { field: "converted", to: target.kind === "task" ? "tarea" : "proyecto" },
  );
}
