"use server";

import { revalidatePath } from "next/cache";
import { logActivity, sendNotification } from "@/lib/activity/record";
import { getCurrentUser } from "@/lib/auth/session";
import { checkIdeaConvertible, markIdeaConverted } from "@/lib/ideas/convert";
import { createClient } from "@/lib/supabase/server";
import { getPeople, getProjects } from "@/lib/tasks/queries";
import type { ActionResult } from "@/lib/tasks/types";
import { isUuid } from "@/lib/tasks/validate";
import type { CreateOptions } from "./types";
import {
  parseDependencyInput,
  parseEventInput,
  parseIdeaInput,
  parseIssueInput,
  parseProjectInput,
} from "./validate";

const SAVE_ERROR = "No se pudo guardar. Probá de nuevo en unos segundos.";

function fail(error: string, detail?: string): ActionResult {
  if (detail) console.error(`[creación rápida] ${error} — ${detail}`);
  return { ok: false, error };
}

// Después de crear algo se vuelve a leer todo lo que lo muestra (Inicio, listas…).
function refreshEverything() {
  revalidatePath("/", "layout");
}

/** Desplegables de los formularios. Se piden al abrir cada uno, así siempre están al día. */
export async function getCreateOptions(): Promise<CreateOptions> {
  const me = await getCurrentUser();
  const supabase = await createClient();

  const [people, projects, tasks] = await Promise.all([
    getPeople(),
    getProjects(),
    supabase
      .from("tasks")
      .select("id, title")
      .is("parent_task_id", null)
      .eq("assignee_id", me.id)
      .neq("status", "listo")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(100),
  ]);
  if (tasks.error) throw new Error(`No se pudieron cargar tus tareas: ${tasks.error.message}`);

  return {
    meId: me.id,
    defaultArea: people.find((person) => person.id === me.id)?.defaultArea ?? null,
    people,
    projects,
    myTasks: (tasks.data ?? []) as { id: string; title: string }[],
  };
}

export async function createIdea(raw: unknown): Promise<ActionResult> {
  const parsed = parseIdeaInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      title: input.title,
      description: input.description || null,
      creator_id: me.id,
      area: input.area,
    })
    .select("id")
    .single();
  if (error || !data) return fail(SAVE_ERROR, error?.message);

  await logActivity(supabase, me.id, "creo", { type: "idea", id: data.id as string, title: input.title });

  refreshEverything();
  return { ok: true };
}

export async function createIssue(raw: unknown): Promise<ActionResult> {
  const parsed = parseIssueInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("system_issues")
    .insert({
      title: input.title,
      description: input.description || null,
      category: input.category,
      priority: input.priority,
      reporter_id: me.id,
      assignee_id: input.assigneeId,
      steps_to_reproduce: input.steps || null,
    })
    .select("id")
    .single();
  if (error || !data) return fail(SAVE_ERROR, error?.message);

  const entity = { type: "system_issue" as const, id: data.id as string, title: input.title };
  await logActivity(supabase, me.id, "creo", entity);

  // Con responsable, se le avisa a esa persona; sin responsable va a la bandeja de Sistemas y se avisa a esa área.
  let recipients: string[];
  if (input.assigneeId) {
    recipients = [input.assigneeId];
  } else {
    const { data: sistemas } = await supabase
      .from("profiles")
      .select("id")
      .eq("default_area", "sistemas")
      .eq("is_active", true);
    recipients = (sistemas ?? []).map((person) => person.id as string);
  }
  for (const userId of new Set(recipients)) {
    if (userId === me.id) continue;
    await sendNotification(supabase, {
      userId,
      actorId: me.id,
      type: "asignacion",
      entity,
      message: `${me.name} reportó un problema: ${input.title}.`,
    });
  }

  refreshEverything();
  return { ok: true };
}

export async function createEvent(raw: unknown): Promise<ActionResult> {
  const parsed = parseEventInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      title: input.title,
      description: input.description || null,
      category: input.category,
      kind: input.kind,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      all_day: input.allDay,
      project_id: input.projectId,
      created_by: me.id,
    })
    .select("id")
    .single();
  if (error || !data) return fail(SAVE_ERROR, error?.message);

  await logActivity(supabase, me.id, "creo", {
    type: "calendar_event",
    id: data.id as string,
    title: input.title,
  });

  refreshEverything();
  return { ok: true };
}

/** `options.fromIdeaId`: el proyecto nace de convertir una idea, que queda marcada como convertida. */
export async function createProject(raw: unknown, options?: { fromIdeaId?: string }): Promise<ActionResult> {
  const parsed = parseProjectInput(raw);
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

  const ownerId = input.ownerId ?? me.id;
  // Quien crea el proyecto y su responsable siempre forman parte de él.
  const memberIds = [...new Set([me.id, ownerId, ...input.memberIds])];

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      description: input.description || null,
      owner_id: ownerId,
      start_date: input.startDate,
      target_date: input.targetDate,
      status: input.status,
      created_by: me.id,
    })
    .select("id")
    .single();
  if (error || !data) return fail(SAVE_ERROR, error?.message);
  const projectId = data.id as string;

  const { error: membersError } = await supabase
    .from("project_members")
    .insert(memberIds.map((userId) => ({ project_id: projectId, user_id: userId })));
  if (membersError) {
    // Sin integrantes el proyecto quedaría a medias: se deshace todo.
    await supabase.from("projects").delete().eq("id", projectId);
    return fail(SAVE_ERROR, membersError.message);
  }

  const entity = { type: "project" as const, id: projectId, title: input.name };
  await logActivity(supabase, me.id, "creo", entity);
  for (const userId of memberIds) {
    if (userId === me.id) continue;
    await sendNotification(supabase, {
      userId,
      actorId: me.id,
      type: "asignacion",
      entity,
      message: `${me.name} te sumó al proyecto: ${input.name}.`,
    });
  }
  if (idea) await markIdeaConverted(supabase, me.id, idea, { kind: "project", id: projectId });

  refreshEverything();
  return { ok: true };
}

/** "Necesito de…": le pido algo a otra persona; si indico una tarea mía, queda bloqueada hasta que me lo entregue. */
export async function createDependency(raw: unknown): Promise<ActionResult> {
  const parsed = parseDependencyInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const me = await getCurrentUser();
  if (input.providerId === me.id) return fail("Elegí a otra persona: no podés pedirte algo a vos mismo.");

  const supabase = await createClient();

  if (input.taskId) {
    const { data: task } = await supabase.from("tasks").select("assignee_id").eq("id", input.taskId).maybeSingle();
    if (!task) return fail("No encontramos la tarea elegida.");
    if (task.assignee_id !== me.id) return fail("Solo podés bloquear tareas que tenés asignadas.");
  }

  const { data, error } = await supabase
    .from("dependencies")
    .insert({
      requester_id: me.id,
      provider_id: input.providerId,
      title: input.title,
      description: input.description || null,
      due_date: input.dueDate,
      task_id: input.taskId,
      project_id: input.projectId,
    })
    .select("id")
    .single();
  if (error || !data) return fail(SAVE_ERROR, error?.message);

  const entity = { type: "dependency" as const, id: data.id as string, title: input.title };
  await logActivity(supabase, me.id, "creo", entity);
  await sendNotification(supabase, {
    userId: input.providerId,
    actorId: me.id,
    type: "pedido_nuevo",
    entity,
    message: `${me.name} necesita de vos: ${input.title}.`,
  });

  refreshEverything();
  return { ok: true };
}
