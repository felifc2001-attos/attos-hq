"use server";

import { revalidatePath } from "next/cache";
import { logActivity, sendNotification } from "@/lib/activity/record";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/tasks/types";
import { isUuid } from "@/lib/tasks/validate";

// Responder a los pedidos "Necesito de…": quien debe algo lo entrega; quien lo pidió puede cancelarlo.

function fail(error: string, detail?: string): ActionResult {
  if (detail) console.error(`[pedidos] ${error} — ${detail}`);
  return { ok: false, error };
}

/** Marca como entregado un pedido que me hicieron. Libera la tarea que estaba bloqueada. */
export async function deliverDependency(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Pedido inválido.");

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("dependencies")
    .select("title, status, requester_id, provider_id")
    .eq("id", id)
    .maybeSingle();
  if (!request) return fail("No encontramos el pedido. Puede que ya lo hayan cancelado.");
  if (request.provider_id !== me.id) return fail("Solo quien recibió el pedido puede marcarlo como entregado.");
  if (request.status === "entregado") return { ok: true };

  const { error } = await supabase.from("dependencies").update({ status: "entregado" }).eq("id", id);
  if (error) return fail("No se pudo marcar como entregado. Probá de nuevo.", error.message);

  const entity = { type: "dependency" as const, id, title: request.title as string };
  await logActivity(supabase, me.id, "entrego", entity);
  await sendNotification(supabase, {
    userId: request.requester_id as string,
    actorId: me.id,
    type: "pedido_entregado",
    entity,
    message: `${me.name} entregó lo que esperabas: ${entity.title}.`,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Cancela un pedido que yo hice (por ejemplo, si me equivoqué). La tarea vuelve a quedar libre. */
export async function cancelDependency(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Pedido inválido.");

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("dependencies")
    .select("requester_id")
    .eq("id", id)
    .maybeSingle();
  if (!request) return { ok: true }; // ya no existe: nada que hacer
  if (request.requester_id !== me.id) return fail("Solo quien hizo el pedido puede cancelarlo.");

  const { error } = await supabase.from("dependencies").delete().eq("id", id);
  if (error) return fail("No se pudo cancelar el pedido. Probá de nuevo.", error.message);

  revalidatePath("/", "layout");
  return { ok: true };
}
