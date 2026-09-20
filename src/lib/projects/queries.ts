import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/quick-create/constants";
import type { Person } from "@/lib/tasks/types";
import type { ProjectSummary } from "./types";

// El proyecto con su responsable y sus integrantes, en una sola consulta.
const PROJECT_SELECT = `
  id, name, description, status, start_date, target_date,
  owner:profiles!owner_id(id, full_name, color),
  project_members(profiles(id, full_name, color))
`;

interface PersonRow {
  id: string;
  full_name: string;
  color: string;
}

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  target_date: string | null;
  owner: PersonRow | null;
  project_members: { profiles: PersonRow | null }[];
}

interface ProgressRow {
  id: string;
  progress: number;
  task_count: number;
  done_count: number;
}

const toPerson = (row: PersonRow): Person => ({ id: row.id, fullName: row.full_name, color: row.color });

function toSummary(row: ProjectRow, progress: ProgressRow | undefined): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    owner: row.owner ? toPerson(row.owner) : null,
    members: row.project_members
      .flatMap((member) => (member.profiles ? [toPerson(member.profiles)] : []))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "es")),
    startDate: row.start_date,
    targetDate: row.target_date,
    progress: progress?.progress ?? 0,
    taskCount: progress?.task_count ?? 0,
    doneCount: progress?.done_count ?? 0,
  };
}

/** Todos los proyectos con su progreso (calculado por la base según las tareas). */
export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const supabase = await createClient();

  const [projects, progress] = await Promise.all([
    supabase.from("projects").select(PROJECT_SELECT).order("created_at", { ascending: false }).limit(200),
    supabase.from("projects_with_progress").select("id, progress, task_count, done_count").limit(200),
  ]);
  if (projects.error) throw new Error(`No se pudieron cargar los proyectos: ${projects.error.message}`);
  if (progress.error) throw new Error(`No se pudo cargar el progreso: ${progress.error.message}`);

  const progressById = new Map(((progress.data ?? []) as ProgressRow[]).map((row) => [row.id, row]));
  return ((projects.data ?? []) as unknown as ProjectRow[]).map((row) => toSummary(row, progressById.get(row.id)));
}

export async function getProjectSummary(id: string): Promise<ProjectSummary | null> {
  const supabase = await createClient();

  const [project, progress] = await Promise.all([
    supabase.from("projects").select(PROJECT_SELECT).eq("id", id).maybeSingle(),
    supabase.from("projects_with_progress").select("id, progress, task_count, done_count").eq("id", id).maybeSingle(),
  ]);
  if (project.error) throw new Error(`No se pudo cargar el proyecto: ${project.error.message}`);
  if (progress.error) throw new Error(`No se pudo cargar el progreso: ${progress.error.message}`);
  if (!project.data) return null;

  return toSummary(project.data as unknown as ProjectRow, (progress.data as ProgressRow | null) ?? undefined);
}
