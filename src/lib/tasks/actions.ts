"use server";

import { revalidatePath } from "next/cache";
import {
  logActivity as recordActivity,
  sendNotification,
  type ActivityAction,
} from "@/lib/activity/record";
import { getCurrentUser } from "@/lib/auth/session";
import { checkIdeaConvertible, markIdeaConverted } from "@/lib/ideas/convert";
import { createClient } from "@/lib/supabase/server";
import { STATUSES, type TaskStatus } from "./constants";
import { getPeople, getProjects } from "./queries";
import type { ActionResult, TaskFormOptions } from "./types";
import { isUuid, parseTaskInput } from "./validate";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Actor = Awaited<ReturnType<typeof getCurrentUser>>;

const SAVE_ERROR = "No se pudo guardar. Probá de nuevo en unos segundos.";

function fail(error: string, detail?: string): ActionResult {
  if (detail) console.error(`[tareas] ${error} — ${detail}`);
  return { ok: false, error };
}

// Después de cambiar una tarea se vuelve a leer todo lo que la muestra (Inicio, Mi día, Tareas).
function refreshEverything() {
  revalidatePath("/", "layout");
}

// El historial y los avisos son secundarios: si fallan, la tarea igual quedó guardada.
async function logActivity(
  supabase: Supabase,
  actor: Actor,
  action: ActivityAction,
  task: { id: string; title: string },
  metadata: Record<string, string> = {},
) {
  await recordActivity(supabase, actor.id, action, { type: "task", ...task }, metadata);
}

async function logStatusChange(
  supabase: Supabase,
  actor: Actor,
  task: { id: string; title: string },
  from: TaskStatus,
  to: TaskStatus,
) {
  await logActivity(supabase, actor, to === "listo" ? "completo" : "movio", task, { from, to });
}

async function notifyAssignment(
  supabase: Supabase,
  actor: Actor,
  assigneeId: string | null,
  task: { id: string; title: string },
) {
  if (!assigneeId || assigneeId === actor.id) return; // asignarse a uno mismo no avisa a nadie
  await sendNotification(supabase, {
    userId: assigneeId,
    actorId: actor.id,
    type: "asignacion",
    entity: { type: "task", ...task },
    message: `${actor.name} te asignó: ${task.title}.`,
  });
}

async function personName(supabase: Supabase, id: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("full_name").eq("id", id).maybeSingle();
  return (data?.full_name as string | undefined) ?? "";
}

/** Desplegables del formulario. Se pide al abrirlo, así siempre está al día. */
export async function getTaskFormOptions(): Promise<TaskFormOptions> {
  const me = await getCurrentUser();
  const [people, projects] = await Promise.all([getPeople(), getProjects()]);
  return {
    meId: me.id,
    defaultArea: people.find((person) => person.id === me.id)?.defaultArea ?? null,
    people,
    projects,
  };
}

/** `options.fromIdeaId`: la tarea nace de convertir una idea, que queda marcada como convertida. */
export async function createTask(raw: unknown, options?: { fromIdeaId?: string }): Promise<ActionResult> {
  const parsed = parseTaskInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const fromIdeaId = options?.fromIdeaId;
  if (fromIdeaId !== undefined && !isUuid(fromIdeaId)) return fail("Idea inválida.");

  const me = await getCurrentUser();
  const supabase = await createClient();

  let idea: { id: string; title: string } | null = null;
  if (fromIdeaId) {
    const check = await checkIdeaConvertible(supabase, fromIdeaId);
    if (!check.ok) return fail(check.error);
    idea = { id: fromIdeaId, title: check.title };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description || null,
      assignee_id: input.assigneeId,
      creator_id: me.id,
      area: input.area,
      project_id: input.projectId,
      due_date: input.dueDate,
      priority: input.priority,
      status: input.status,
    })
    .select("id")
    .single();
  if (error || !data) return fail(SAVE_ERROR, error?.message);

  const task = { id: data.id as string, title: input.title };
  await logActivity(supabase, me, "creo", task);
  await notifyAssignment(supabase, me, input.assigneeId, task);
  if (idea) await markIdeaConverted(supabase, me.id, idea, { kind: "task", id: task.id });

  refreshEverything();
  return { ok: true };
}

export async function updateTask(id: string, raw: unknown): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Tarea inválida.");
  const parsed = parseTaskInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("tasks")
    .select("status, assignee_id, due_date, priority")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("No encontramos la tarea. Puede que ya la hayan eliminado.");

  const { error } = await supabase
    .from("tasks")
    .update({
      title: input.title,
      description: input.description || null,
      assignee_id: input.assigneeId,
      area: input.area,
      project_id: input.projectId,
      due_date: input.dueDate,
      priority: input.priority,
      status: input.status,
    })
    .eq("id", id);
  if (error) return fail(SAVE_ERROR, error.message);

  const task = { id, title: input.title };
  if (input.status !== before.status) {
    await logStatusChange(supabase, me, task, before.status as TaskStatus, input.status);
  }
  if (input.assigneeId !== before.assignee_id) {
    const name = input.assigneeId ? await personName(supabase, input.assigneeId) : "";
    await logActivity(supabase, me, "actualizo", task, { field: "assignee", to: name });
    await notifyAssignment(supabase, me, input.assigneeId, task);
  }
  if (input.dueDate !== (before.due_date ?? null)) {
    await logActivity(supabase, me, "actualizo", task, { field: "due_date", to: input.dueDate ?? "" });
  }
  if (input.priority !== before.priority) {
    await logActivity(supabase, me, "actualizo", task, { field: "priority", to: input.priority });
  }

  refreshEverything();
  return { ok: true };
}

/** Soltar una tarjeta del Kanban: cambia de columna (estado) y/o de lugar dentro de la columna. */
export async function moveTask(id: string, status: string, position: number): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Tarea inválida.");
  const next = STATUSES.find((option) => option.value === status)?.value;
  if (!next) return fail("Estado inválido.");
  if (typeof position !== "number" || !Number.isFinite(position) || Math.abs(position) > 1e12) {
    return fail("Posición inválida.");
  }

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("tasks")
    .select("title, status")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("No encontramos la tarea. Puede que ya la hayan eliminado.");

  const { error } = await supabase.from("tasks").update({ status: next, position }).eq("id", id);
  if (error) return fail("No se pudo mover la tarea. Probá de nuevo.", error.message);

  if (before.status !== next) {
    await logStatusChange(supabase, me, { id, title: before.title as string }, before.status as TaskStatus, next);
  }

  refreshEverything();
  return { ok: true };
}

/** Cambio rápido de estado (checkbox y selector de la lista). */
export async function setTaskStatus(id: string, status: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Tarea inválida.");
  const next = STATUSES.find((option) => option.value === status)?.value;
  if (!next) return fail("Estado inválido.");

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("tasks")
    .select("title, status")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("No encontramos la tarea. Puede que ya la hayan eliminado.");
  if (before.status === next) return { ok: true };

  const { error } = await supabase.from("tasks").update({ status: next }).eq("id", id);
  if (error) return fail(SAVE_ERROR, error.message);

  await logStatusChange(supabase, me, { id, title: before.title as string }, before.status as TaskStatus, next);

  refreshEverything();
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return fail("Tarea inválida.");

  await getCurrentUser(); // verifica que haya sesión
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return fail("No se pudo eliminar. Probá de nuevo en unos segundos.", error.message);

  refreshEverything();
  return { ok: true };
}
