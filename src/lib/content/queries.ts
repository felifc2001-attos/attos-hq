import "server-only";

import { addDays, arToISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Person, ProjectOption } from "@/lib/tasks/types";
import { CONTENT_PUBLISHED_DAYS, type ContentFormat, type ContentStatus, type ReviewStatus } from "./constants";
import type { ContentItem } from "./types";

const CONTENT_SELECT = `
  id, title, format, status, position, publish_at, copy, links, review_status, reviewed_at, created_at,
  assignee_id, creator_id, project_id,
  assignee:profiles!assignee_id(id, full_name, color),
  reviewer:profiles!reviewed_by(id, full_name, color),
  project:projects(id, name)
`;

interface PersonRow {
  id: string;
  full_name: string;
  color: string;
}

interface ContentRow {
  id: string;
  title: string;
  format: ContentFormat;
  status: ContentStatus;
  position: number;
  publish_at: string | null;
  copy: string | null;
  links: string[] | null;
  review_status: ReviewStatus;
  reviewed_at: string | null;
  created_at: string;
  assignee_id: string | null;
  creator_id: string | null;
  project_id: string | null;
  assignee: PersonRow | null;
  reviewer: PersonRow | null;
  project: ProjectOption | null;
}

const toPerson = (row: PersonRow | null): Person | null =>
  row ? { id: row.id, fullName: row.full_name, color: row.color } : null;

function toItem(row: ContentRow): ContentItem {
  return {
    id: row.id,
    title: row.title,
    format: row.format,
    status: row.status,
    position: row.position,
    publishAt: row.publish_at,
    copy: row.copy,
    links: row.links ?? [],
    reviewStatus: row.review_status,
    reviewer: toPerson(row.reviewer),
    reviewedAt: row.reviewed_at,
    assigneeId: row.assignee_id,
    creatorId: row.creator_id,
    projectId: row.project_id,
    assignee: toPerson(row.assignee),
    project: row.project,
    createdAt: row.created_at,
  };
}

/** Todo el recorrido de contenido; en "Publicado" solo lo de los últimos días. */
export async function getContentItems(today: string): Promise<ContentItem[]> {
  const supabase = await createClient();
  const since = arToISO(addDays(today, -CONTENT_PUBLISHED_DAYS));

  const { data, error } = await supabase
    .from("content_items")
    .select(CONTENT_SELECT)
    .or(`status.neq.publicado,updated_at.gte.${since}`)
    .limit(400);
  if (error) throw new Error(`No se pudo cargar el contenido: ${error.message}`);
  return ((data ?? []) as unknown as ContentRow[]).map(toItem);
}

/** Una publicación puntual, para abrirla desde un enlace (por ejemplo, desde una notificación). */
export async function getContentById(id: string): Promise<ContentItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_items").select(CONTENT_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo cargar la publicación: ${error.message}`);
  return data ? toItem(data as unknown as ContentRow) : null;
}

/** Las publicaciones con fecha entre dos días (ambos incluidos), para el Calendario. */
export async function getContentBetween(from: string, to: string): Promise<ContentItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_items")
    .select(CONTENT_SELECT)
    .gte("publish_at", arToISO(from))
    .lt("publish_at", arToISO(addDays(to, 1)))
    .order("publish_at")
    .limit(300);
  if (error) throw new Error(`No se pudo cargar el calendario: ${error.message}`);
  return ((data ?? []) as unknown as ContentRow[]).map(toItem);
}
