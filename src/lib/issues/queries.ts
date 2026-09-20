import "server-only";

import { addDays, arToISO } from "@/lib/dates";
import type { IssueCategory } from "@/lib/quick-create/constants";
import { createClient } from "@/lib/supabase/server";
import type { Priority } from "@/lib/tasks/constants";
import type { Person } from "@/lib/tasks/types";
import { ISSUE_DONE_DAYS, type IssueStatus } from "./constants";
import type { IssueItem } from "./types";

const ISSUE_SELECT = `
  id, title, description, category, priority, status, position, steps_to_reproduce, resolved_at, created_at,
  reporter_id, assignee_id,
  reporter:profiles!reporter_id(id, full_name, color),
  assignee:profiles!assignee_id(id, full_name, color)
`;

interface PersonRow {
  id: string;
  full_name: string;
  color: string;
}

interface IssueRow {
  id: string;
  title: string;
  description: string | null;
  category: IssueCategory;
  priority: Priority;
  status: IssueStatus;
  position: number;
  steps_to_reproduce: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter_id: string | null;
  assignee_id: string | null;
  reporter: PersonRow | null;
  assignee: PersonRow | null;
}

const toPerson = (row: PersonRow | null): Person | null =>
  row ? { id: row.id, fullName: row.full_name, color: row.color } : null;

function toItem(row: IssueRow): IssueItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    position: row.position,
    steps: row.steps_to_reproduce,
    reporterId: row.reporter_id,
    assigneeId: row.assignee_id,
    reporter: toPerson(row.reporter),
    assignee: toPerson(row.assignee),
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  };
}

/** Todos los problemas; en "En producción" solo lo de los últimos días. */
export async function getIssues(today: string): Promise<IssueItem[]> {
  const supabase = await createClient();
  const since = arToISO(addDays(today, -ISSUE_DONE_DAYS));

  const { data, error } = await supabase
    .from("system_issues")
    .select(ISSUE_SELECT)
    .or(`status.neq.produccion,updated_at.gte.${since}`)
    .limit(400);
  if (error) throw new Error(`No se pudieron cargar los problemas: ${error.message}`);
  return ((data ?? []) as unknown as IssueRow[]).map(toItem);
}

/** Un problema puntual, para abrirlo desde un enlace (por ejemplo, desde una notificación). */
export async function getIssueById(id: string): Promise<IssueItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("system_issues").select(ISSUE_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo cargar el problema: ${error.message}`);
  return data ? toItem(data as unknown as IssueRow) : null;
}
