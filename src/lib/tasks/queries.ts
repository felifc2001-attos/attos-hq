import "server-only";

import { createClient } from "@/lib/supabase/server";
import { addDays } from "@/lib/dates";
import { compareByDueThenPriority } from "./my-day";
import { KANBAN_DONE_DAYS, type Area, type Priority, type TaskStatus } from "./constants";
import type { TaskFilters } from "./filters";
import type {
  BlockedBy,
  PersonOption,
  ProjectOption,
  Task,
  TaskLabel,
} from "./types";

// Traer la tarea junto con quién la hace, su proyecto y sus etiquetas, en una sola consulta.
const TASK_SELECT = `
  id, title, description, status, priority, area, due_date, completed_at, position,
  assignee_id, creator_id, project_id,
  assignee:profiles!assignee_id(id, full_name, color),
  project:projects(id, name),
  task_labels(labels(id, name, color))
`;

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  area: Area | null;
  due_date: string | null;
  completed_at: string | null;
  position: number;
  assignee_id: string | null;
  creator_id: string | null;
  project_id: string | null;
  assignee: { id: string; full_name: string; color: string } | null;
  project: ProjectOption | null;
  task_labels: { labels: TaskLabel | null }[];
}

function toTask(row: TaskRow, blockedBy: Map<string, BlockedBy[]>): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    area: row.area,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    position: row.position,
    assigneeId: row.assignee_id,
    creatorId: row.creator_id,
    projectId: row.project_id,
    assignee: row.assignee
      ? { id: row.assignee.id, fullName: row.assignee.full_name, color: row.assignee.color }
      : null,
    project: row.project,
    labels: row.task_labels.flatMap((link) => (link.labels ? [link.labels] : [])),
    blockedBy: blockedBy.get(row.id) ?? [],
  };
}

/** Qué tareas están esperando algo de otra persona ("Necesito de…" todavía pendiente). */
async function getBlockedMap(): Promise<Map<string, BlockedBy[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dependencies")
    .select("task_id, title, provider:profiles!provider_id(full_name)")
    .eq("status", "pendiente")
    .not("task_id", "is", null);
  if (error) throw new Error(`No se pudieron cargar los pedidos pendientes: ${error.message}`);

  const map = new Map<string, BlockedBy[]>();
  for (const row of (data ?? []) as unknown as {
    task_id: string;
    title: string;
    provider: { full_name: string } | null;
  }[]) {
    const list = map.get(row.task_id) ?? [];
    list.push({ title: row.title, providerName: row.provider?.full_name ?? "alguien" });
    map.set(row.task_id, list);
  }
  return map;
}

/** Lista de la pantalla Tareas, con los filtros aplicados (solo tareas, no subtareas). */
export async function getTasks(filters: TaskFilters, meId: string, today: string): Promise<Task[]> {
  const supabase = await createClient();

  let query = supabase.from("tasks").select(TASK_SELECT).is("parent_task_id", null);

  if (filters.scope === "mias") {
    query = query.eq("assignee_id", meId);
  } else if (filters.person === "sin_asignar") {
    query = query.is("assignee_id", null);
  } else if (filters.person) {
    query = query.eq("assignee_id", filters.person);
  }

  if (filters.project === "sin_proyecto") query = query.is("project_id", null);
  else if (filters.project) query = query.eq("project_id", filters.project);

  if (filters.area) query = query.eq("area", filters.area);
  if (filters.priority) query = query.eq("priority", filters.priority);

  if (filters.view === "kanban") {
    // El tablero muestra todos los estados; en "Listo" solo lo terminado en las últimas 2 semanas.
    const since = new Date(`${addDays(today, -KANBAN_DONE_DAYS)}T00:00:00-03:00`).toISOString();
    query = query.or(`status.neq.listo,completed_at.gte.${since}`);
  } else if (filters.status) {
    query = query.eq("status", filters.status);
  } else if (!filters.showDone) {
    // Las terminadas se ocultan salvo que se pida verlas o se filtre por estado.
    query = query.neq("status", "listo");
  }

  switch (filters.due) {
    case "vencidas":
      query = query.lt("due_date", today).neq("status", "listo");
      break;
    case "hoy":
      query = query.eq("due_date", today);
      break;
    case "semana":
      query = query.gte("due_date", today).lte("due_date", addDays(today, 6));
      break;
    case "sin_fecha":
      query = query.is("due_date", null);
      break;
  }

  const [{ data, error }, blocked] = await Promise.all([query.limit(500), getBlockedMap()]);
  if (error) throw new Error(`No se pudieron cargar las tareas: ${error.message}`);

  return ((data ?? []) as unknown as TaskRow[])
    .map((row) => toTask(row, blocked))
    .sort(compareByDueThenPriority);
}

export interface MyDayData {
  /** Mis tareas sin terminar. */
  open: Task[];
  /** Tareas en "Para revisar" que hago yo o que creé yo. */
  reviewCandidates: Task[];
  /** Cuántas terminé hoy. */
  doneToday: number;
}

/** Una tarea puntual, para abrirla desde un enlace (por ejemplo, desde una notificación). */
export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient();
  const [{ data, error }, blocked] = await Promise.all([
    supabase.from("tasks").select(TASK_SELECT).eq("id", id).maybeSingle(),
    getBlockedMap(),
  ]);
  if (error) throw new Error(`No se pudo cargar la tarea: ${error.message}`);
  return data ? toTask(data as unknown as TaskRow, blocked) : null;
}

/** Las tareas (no subtareas) con fecha límite entre dos días, ambos incluidos; para el Calendario. */
export async function getTasksDueBetween(from: string, to: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .is("parent_task_id", null)
    .gte("due_date", from)
    .lte("due_date", to)
    .order("due_date")
    .limit(500);
  if (error) throw new Error(`No se pudieron cargar las tareas: ${error.message}`);
  // El calendario no muestra qué tareas están esperando un pedido, así que no se pide.
  return ((data ?? []) as unknown as TaskRow[]).map((row) => toTask(row, new Map()));
}

export async function getMyDayData(meId: string, today: string): Promise<MyDayData> {
  const supabase = await createClient();
  // Argentina no usa horario de verano: el día empieza siempre a las 00:00 (UTC-3).
  const startOfToday = new Date(`${today}T00:00:00-03:00`).toISOString();

  const [open, review, done, blocked] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_SELECT)
      .is("parent_task_id", null)
      .eq("assignee_id", meId)
      .neq("status", "listo")
      .limit(300),
    supabase
      .from("tasks")
      .select(TASK_SELECT)
      .is("parent_task_id", null)
      .eq("status", "para_revisar")
      .or(`assignee_id.eq.${meId},creator_id.eq.${meId}`)
      .limit(100),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .is("parent_task_id", null)
      .eq("assignee_id", meId)
      .gte("completed_at", startOfToday),
    getBlockedMap(),
  ]);

  for (const result of [open, review, done]) {
    if (result.error) throw new Error(`No se pudo cargar Mi día: ${result.error.message}`);
  }

  return {
    open: ((open.data ?? []) as unknown as TaskRow[]).map((row) => toTask(row, blocked)),
    reviewCandidates: ((review.data ?? []) as unknown as TaskRow[]).map((row) => toTask(row, blocked)),
    doneToday: done.count ?? 0,
  };
}

export async function getPeople(): Promise<PersonOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, color, default_area")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw new Error(`No se pudo cargar el equipo: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    fullName: row.full_name as string,
    color: row.color as string,
    defaultArea: (row.default_area as Area | null) ?? null,
  }));
}

export async function getProjects(): Promise<ProjectOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .neq("status", "finalizado")
    .order("name");
  if (error) throw new Error(`No se pudieron cargar los proyectos: ${error.message}`);
  return (data ?? []) as ProjectOption[];
}
