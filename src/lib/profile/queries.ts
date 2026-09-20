import "server-only";

import { getActivityByActor } from "@/lib/activity/queries";
import { startOfWeek } from "@/lib/calendar/range";
import { arToISO } from "@/lib/dates";
import { isNotificationType, type NotificationTypeValue } from "@/lib/notifications/preferences";
import { createClient } from "@/lib/supabase/server";
import type { Area } from "@/lib/tasks/constants";
import { DEFAULT_FILTERS } from "@/lib/tasks/filters";
import { getTasks } from "@/lib/tasks/queries";
import type { NotificationPreferences, ProfileData, ProfileOverview, ProfileProject } from "./types";

const PROFILE_SELECT = "id, email, full_name, area, default_area, color";

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string;
  area: string | null;
  default_area: Area | null;
  color: string;
}

const toProfile = (row: ProfileRow): ProfileData => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email ?? "",
  area: row.area ?? "",
  defaultArea: row.default_area,
  color: row.color,
});

/** Cuántas tareas sin terminar mostrar en el perfil de una persona. */
const PROFILE_TASKS = 8;

/** Una persona del equipo (solo cuentas activas). */
export async function getProfile(id: string): Promise<ProfileData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el perfil: ${error.message}`);
  return data ? toProfile(data as unknown as ProfileRow) : null;
}

/** Todo el equipo activo, por orden alfabético. */
export async function getTeamProfiles(): Promise<ProfileData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("is_active", true)
    .order("full_name");
  if (error) throw new Error(`No se pudo cargar el equipo: ${error.message}`);
  return ((data ?? []) as unknown as ProfileRow[]).map(toProfile);
}

/** La página de una persona: sus números, sus tareas, sus proyectos y lo último que hizo. */
export async function getProfileOverview(id: string, meId: string, today: string): Promise<ProfileOverview | null> {
  const supabase = await createClient();
  const weekStart = arToISO(startOfWeek(today));

  const [profile, tasks, done, requests, projects, activity] = await Promise.all([
    getProfile(id),
    getTasks({ ...DEFAULT_FILTERS, scope: "todas", person: id }, meId, today),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .is("parent_task_id", null)
      .eq("assignee_id", id)
      .eq("status", "listo")
      .gte("completed_at", weekStart),
    supabase
      .from("dependencies")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", id)
      .eq("status", "pendiente"),
    supabase
      .from("project_members")
      .select("projects!inner(id, name, status)")
      .eq("user_id", id)
      .in("projects.status", ["en_curso", "planificando"]),
    getActivityByActor(id, 8),
  ]);
  if (!profile) return null;

  for (const result of [done, requests, projects]) {
    if (result.error) throw new Error(`No se pudo cargar el perfil: ${result.error.message}`);
  }

  const activeProjects: ProfileProject[] = ((projects.data ?? []) as unknown as { projects: ProfileProject | null }[])
    .flatMap((row) => (row.projects ? [row.projects] : []))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return {
    profile,
    stats: {
      openTasks: tasks.length,
      overdueTasks: tasks.filter((task) => task.dueDate !== null && task.dueDate < today).length,
      doneThisWeek: done.count ?? 0,
      activeProjects: activeProjects.length,
      pendingRequests: requests.count ?? 0,
    },
    tasks: tasks.slice(0, PROFILE_TASKS),
    projects: activeProjects,
    activity,
  };
}

/** Los tipos de aviso que silenció esta persona. Si falta la columna (no se ejecutó el archivo de la Etapa 9), `available` es false. */
export async function getNotificationPreferences(meId: string): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("muted_notification_types").eq("id", meId).maybeSingle();

  if (error) {
    // 42703 = la columna no existe todavía.
    if (error.code === "42703") return { available: false, muted: [] };
    throw new Error(`No se pudieron cargar tus preferencias: ${error.message}`);
  }

  const muted = ((data?.muted_notification_types ?? []) as unknown[]).filter(isNotificationType) as NotificationTypeValue[];
  return { available: true, muted };
}
