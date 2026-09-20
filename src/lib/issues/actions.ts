"use server";

import { revalidatePath } from "next/cache";
import { logActivity, sendNotification } from "@/lib/activity/record";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/tasks/types";
import { isUuid } from "@/lib/tasks/validate";
import { ISSUE_STATUSES, type IssueStatus } from "./constants";
import { planIssueStatus, type IssueStatusPlan } from "./rules";
import { parseIssueEditInput } from "./validate";

// Editar, mover, tomar y eliminar problemas. Reportarlos está en lib/quick-create (createIssue).

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Actor = Awaited<ReturnType<typeof getCurrentUser>>;

const SAVE_ERROR = "No se pudo guardar. Probá de nuevo en unos segundos.";
const NOT_FOUND = "No encontramos el problema. Puede que ya lo hayan eliminado.";

function fail(error: string, detail?: string): ActionResult {
  if (detail) console.error(`[sistemas] ${error} — ${detail}`);
  return { ok: false, error };
}

// Después de tocar un problema se vuelve a leer todo lo que lo muestra (Sistemas, Inicio…).
function refreshEverything() {
  revalidatePath("/", "layout");
}

interface Existing {
  title: string;
  status: IssueStatus;
  reporter_id: string | null;
  assignee_id: string | null;
}

async function loadExisting(supabase: Supabase, id: string): Promise<Existing | null> {
  const { data } = await supabase
    .from("system_issues")
    .select("title, status, reporter_id, assignee_id")
    .eq("id", id)
    .maybeSingle();
  return (data as Existing | null) ?? null;
}

const entityOf = (id: string, title: string) => ({ type: "system_issue" as const, id, title });

/** La columna `resolved_at` según lo que pide el plan de cambio de estado. */
function resolvedPatch(plan: IssueStatusPlan): { resolved_at?: string | null } {
  if (plan.resolved === "set") return { resolved_at: new Date().toISOString() };
  if (plan.resolved === "clear") return { resolved_at: null };
  return {};
}

/** Registra el cambio de columna y, si llegó a producción, le avisa a quien lo reportó. */
async function afterStatusChange(
  supabase: Supabase,
  me: Actor,
  id: string,
  existing: Existing,
  to: IssueStatus,
  plan: IssueStatusPlan,
  title = existing.title,
) {
  if (!plan.changed) return;
  await logActivity(supabase, me.id, plan.resolved === "set" ? "completo" : "movio", entityOf(id, title), {
    from: existing.status,
    to,
  });
  if (plan.notifyReporter && existing.reporter_id && existing.reporter_id !== me.id) {
    await sendNotification(supabase, {
      userId: existing.reporter_id,
      actorId: me.id,
      type: "problema_resuelto",
      entity: entityOf(id, title),
      message: `${me.name} resolvió el problema que reportaste: ${title}.`,
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
    message: `${me.name} te asignó un problema: ${title}.`,
  });
}

async function personName(supabase: Supabase, id: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("full_name").eq("id", id).maybeSingle();
  return (data?.full_name as string | undefined) ?? "";
}

export async function updateIssue(id: string, raw: unknown): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Problema inválido.");
  const parsed = parseIssueEditInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const me = await getCurrentUser();
  const supabase = await createClient();

  const before = await loadExisting(supabase, id);
  if (!before) return fail(NOT_FOUND);

  const plan = planIssueStatus(before.status, input.status);
  const { error } = await supabase
    .from("system_issues")
    .update({
      title: input.title,
      description: input.description || null,
      category: input.category,
      priority: input.priority,
      status: input.status,
      assignee_id: input.assigneeId,
      steps_to_reproduce: input.steps || null,
      ...resolvedPatch(plan),
    })
    .eq("id", id);
  if (error) return fail(SAVE_ERROR, error.message);

  await afterStatusChange(supabase, me, id, before, input.status, plan, input.title);
  if (input.assigneeId !== before.assignee_id) {
    const name = input.assigneeId ? await personName(supabase, input.assigneeId) : "";
    await logActivity(supabase, me.id, "actualizo", entityOf(id, input.title), { field: "assignee", to: name });
    await notifyAssignment(supabase, me, input.assigneeId, id, input.title);
  }

  refreshEverything();
  return { ok: true };
}

/** Soltar una tarjeta del tablero: cambia de columna y/o de lugar dentro de la columna. */
export async function moveIssue(id: string, status: string, position: number): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Problema inválido.");
  const next = ISSUE_STATUSES.find((option) => option.value === status)?.value;
  if (!next) return fail("Estado inválido.");
  if (typeof position !== "number" || !Number.isFinite(position) || Math.abs(position) > 1e12) {
    return fail("Posición inválida.");
  }

  const me = await getCurrentUser();
  const supabase = await createClient();

  const before = await loadExisting(supabase, id);
  if (!before) return fail(NOT_FOUND);

  const plan = planIssueStatus(before.status, next);
  const { error } = await supabase
    .from("system_issues")
    .update({ status: next, position, ...resolvedPatch(plan) })
    .eq("id", id);
  if (error) return fail("No se pudo mover el problema. Probá de nuevo.", error.message);

  await afterStatusChange(supabase, me, id, before, next, plan);

  refreshEverything();
  return { ok: true };
}

/** Tomar un problema de la bandeja de Sistemas: queda asignado a quien lo toma. */
export async function takeIssue(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Problema inválido.");

  const me = await getCurrentUser();
  const supabase = await createClient();

  const before = await loadExisting(supabase, id);
  if (!before) return fail(NOT_FOUND);
  if (before.assignee_id) return fail("Alguien ya tomó este problema.");

  const { error } = await supabase.from("system_issues").update({ assignee_id: me.id }).eq("id", id);
  if (error) return fail(SAVE_ERROR, error.message);

  await logActivity(supabase, me.id, "actualizo", entityOf(id, before.title), { field: "assignee", to: me.name });

  refreshEverything();
  return { ok: true };
}

export async function deleteIssue(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Problema inválido.");

  await getCurrentUser(); // verifica que haya sesión
  const supabase = await createClient();

  const { error } = await supabase.from("system_issues").delete().eq("id", id);
  if (error) return fail("No se pudo eliminar. Probá de nuevo en unos segundos.", error.message);

  refreshEverything();
  return { ok: true };
}
