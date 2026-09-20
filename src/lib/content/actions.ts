"use server";

import { revalidatePath } from "next/cache";
import { logActivity, sendNotification } from "@/lib/activity/record";
import { getCurrentUser } from "@/lib/auth/session";
import { dateInAR } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/tasks/types";
import { isUuid } from "@/lib/tasks/validate";
import { CONTENT_STATUSES, type ContentStatus, type ReviewStatus } from "./constants";
import { canReview, planContentStatus, statusAfterApproval } from "./rules";
import { parseContentInput, parseReviewNote } from "./validate";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Actor = Awaited<ReturnType<typeof getCurrentUser>>;

const SAVE_ERROR = "No se pudo guardar. Probá de nuevo en unos segundos.";
const NOT_FOUND = "No encontramos la publicación. Puede que ya la hayan eliminado.";

function fail(error: string, detail?: string): ActionResult {
  if (detail) console.error(`[contenido] ${error} — ${detail}`);
  return { ok: false, error };
}

// Después de tocar el contenido se vuelve a leer todo lo que lo muestra (Contenido, Calendario, Inicio…).
function refreshEverything() {
  revalidatePath("/", "layout");
}

interface Existing {
  title: string;
  status: ContentStatus;
  review_status: ReviewStatus;
  assignee_id: string | null;
  creator_id: string | null;
  publish_at: string | null;
}

async function loadExisting(supabase: Supabase, id: string): Promise<Existing | null> {
  const { data } = await supabase
    .from("content_items")
    .select("title, status, review_status, assignee_id, creator_id, publish_at")
    .eq("id", id)
    .maybeSingle();
  return (data as Existing | null) ?? null;
}

const entityOf = (id: string, title: string) => ({ type: "content_item" as const, id, title });

/** Avisa a todo el equipo (menos a quien lo pide) que hay una publicación esperando aprobación. */
async function notifyApprovers(supabase: Supabase, me: Actor, id: string, title: string) {
  const { data } = await supabase.from("profiles").select("id").eq("is_active", true).neq("id", me.id);
  for (const person of (data ?? []) as { id: string }[]) {
    await sendNotification(supabase, {
      userId: person.id,
      actorId: me.id,
      type: "aprobacion_solicitada",
      entity: entityOf(id, title),
      message: `${me.name} pidió tu aprobación: ${title}.`,
    });
  }
}

/** Avisa a quien la hace y a quien la creó (menos a quien revisó) cómo salió la revisión. */
async function notifyReviewResult(supabase: Supabase, me: Actor, id: string, existing: Existing, message: string) {
  const recipients = new Set([existing.assignee_id, existing.creator_id].filter((userId): userId is string => !!userId && userId !== me.id));
  for (const userId of recipients) {
    await sendNotification(supabase, {
      userId,
      actorId: me.id,
      type: "aprobacion_resuelta",
      entity: entityOf(id, existing.title),
      message,
    });
  }
}

async function notifyAssignment(supabase: Supabase, me: Actor, assigneeId: string | null, id: string, title: string) {
  if (!assigneeId || assigneeId === me.id) return; // asignarse a uno mismo no avisa a nadie
  await sendNotification(supabase, {
    userId: assigneeId,
    actorId: me.id,
    type: "asignacion",
    entity: entityOf(id, title),
    message: `${me.name} te asignó contenido: ${title}.`,
  });
}

async function personName(supabase: Supabase, id: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("full_name").eq("id", id).maybeSingle();
  return (data?.full_name as string | undefined) ?? "";
}

export async function createContent(raw: unknown): Promise<ActionResult> {
  const parsed = parseContentInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  // Una publicación nueva nace sin aprobar.
  const plan = planContentStatus("ideas", input.status, "pendiente");
  if (!plan.ok) return fail(plan.error);

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_items")
    .insert({
      title: input.title,
      format: input.format,
      status: input.status,
      assignee_id: input.assigneeId,
      creator_id: me.id,
      project_id: input.projectId,
      publish_at: input.publishAt,
      copy: input.copy || null,
      links: input.links,
    })
    .select("id")
    .single();
  if (error || !data) return fail(SAVE_ERROR, error?.message);

  const id = data.id as string;
  await logActivity(supabase, me.id, "creo", entityOf(id, input.title));
  await notifyAssignment(supabase, me, input.assigneeId, id, input.title);
  if (plan.notifyApprovers) await notifyApprovers(supabase, me, id, input.title);

  refreshEverything();
  return { ok: true };
}

export async function updateContent(id: string, raw: unknown): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Publicación inválida.");
  const parsed = parseContentInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const me = await getCurrentUser();
  const supabase = await createClient();

  const before = await loadExisting(supabase, id);
  if (!before) return fail(NOT_FOUND);

  const plan = planContentStatus(before.status, input.status, before.review_status);
  if (!plan.ok) return fail(plan.error);

  const { error } = await supabase
    .from("content_items")
    .update({
      title: input.title,
      format: input.format,
      status: input.status,
      assignee_id: input.assigneeId,
      project_id: input.projectId,
      publish_at: input.publishAt,
      copy: input.copy || null,
      links: input.links,
      ...(plan.review ? { review_status: plan.review, reviewed_by: null, reviewed_at: null } : {}),
    })
    .eq("id", id);
  if (error) return fail(SAVE_ERROR, error.message);

  const entity = entityOf(id, input.title);
  if (plan.changed) await logActivity(supabase, me.id, "movio", entity, { from: before.status, to: input.status });
  if (input.assigneeId !== before.assignee_id) {
    const name = input.assigneeId ? await personName(supabase, input.assigneeId) : "";
    await logActivity(supabase, me.id, "actualizo", entity, { field: "assignee", to: name });
    await notifyAssignment(supabase, me, input.assigneeId, id, input.title);
  }
  const day = input.publishAt ? dateInAR(input.publishAt) : "";
  if (day !== (before.publish_at ? dateInAR(before.publish_at) : "")) {
    await logActivity(supabase, me.id, "actualizo", entity, { field: "date", to: day });
  }
  if (plan.notifyApprovers) await notifyApprovers(supabase, me, id, input.title);

  refreshEverything();
  return { ok: true };
}

/** Soltar una tarjeta del tablero: cambia de columna y/o de lugar dentro de la columna. */
export async function moveContent(id: string, status: string, position: number): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Publicación inválida.");
  const next = CONTENT_STATUSES.find((option) => option.value === status)?.value;
  if (!next) return fail("Estado inválido.");
  if (typeof position !== "number" || !Number.isFinite(position) || Math.abs(position) > 1e12) {
    return fail("Posición inválida.");
  }

  const me = await getCurrentUser();
  const supabase = await createClient();

  const before = await loadExisting(supabase, id);
  if (!before) return fail(NOT_FOUND);

  const plan = planContentStatus(before.status, next, before.review_status);
  if (!plan.ok) return fail(plan.error);

  const { error } = await supabase
    .from("content_items")
    .update({
      status: next,
      position,
      ...(plan.review ? { review_status: plan.review, reviewed_by: null, reviewed_at: null } : {}),
    })
    .eq("id", id);
  if (error) return fail("No se pudo mover la publicación. Probá de nuevo.", error.message);

  if (plan.changed) {
    await logActivity(supabase, me.id, "movio", entityOf(id, before.title), { from: before.status, to: next });
  }
  if (plan.notifyApprovers) await notifyApprovers(supabase, me, id, before.title);

  refreshEverything();
  return { ok: true };
}

/** Aprobar lo que está en "Para aprobar": queda programado si ya tiene fecha. */
export async function approveContent(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Publicación inválida.");

  const me = await getCurrentUser();
  const supabase = await createClient();

  const before = await loadExisting(supabase, id);
  if (!before) return fail(NOT_FOUND);
  if (!canReview(before.status)) return fail("Solo se aprueba lo que está en “Para aprobar”.");

  const { error } = await supabase
    .from("content_items")
    .update({
      review_status: "aprobado",
      reviewed_by: me.id,
      reviewed_at: new Date().toISOString(),
      status: statusAfterApproval(before.publish_at),
    })
    .eq("id", id);
  if (error) return fail(SAVE_ERROR, error.message);

  await logActivity(supabase, me.id, "aprobo", entityOf(id, before.title));
  await notifyReviewResult(supabase, me, id, before, `${me.name} aprobó: ${before.title}.`);

  refreshEverything();
  return { ok: true };
}

/** Pedir cambios: vuelve a Diseño y, si hay nota, queda como comentario. */
export async function requestContentChanges(id: string, rawNote: unknown): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Publicación inválida.");
  const note = parseReviewNote(rawNote);
  if (!note.ok) return fail(note.error);

  const me = await getCurrentUser();
  const supabase = await createClient();

  const before = await loadExisting(supabase, id);
  if (!before) return fail(NOT_FOUND);
  if (!canReview(before.status)) return fail("Solo se piden cambios sobre lo que está en “Para aprobar”.");

  const { error } = await supabase
    .from("content_items")
    .update({
      review_status: "cambios_solicitados",
      reviewed_by: me.id,
      reviewed_at: new Date().toISOString(),
      status: "diseno",
    })
    .eq("id", id);
  if (error) return fail(SAVE_ERROR, error.message);

  if (note.value) {
    const { error: commentError } = await supabase
      .from("comments")
      .insert({ entity_type: "content_item", entity_id: id, author_id: me.id, body: `Cambios pedidos: ${note.value}` });
    if (commentError) console.error("[contenido] No se pudo guardar la nota:", commentError.message);
  }
  await logActivity(supabase, me.id, "solicito_cambios", entityOf(id, before.title));
  await notifyReviewResult(supabase, me, id, before, `${me.name} pidió cambios en: ${before.title}.`);

  refreshEverything();
  return { ok: true };
}

export async function deleteContent(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Publicación inválida.");

  await getCurrentUser(); // verifica que haya sesión
  const supabase = await createClient();

  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) return fail("No se pudo eliminar. Probá de nuevo en unos segundos.", error.message);

  refreshEverything();
  return { ok: true };
}
