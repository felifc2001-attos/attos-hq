"use server";

import type { ActivityItem } from "@/lib/activity/describe";
import { getEntityActivity } from "@/lib/activity/queries";
import { logActivity, sendNotification } from "@/lib/activity/record";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, AddCommentResult, CommentItem, CommentsResult } from "@/lib/tasks/types";
import { isUuid } from "@/lib/tasks/validate";
import { isCommentEntityType, type CommentEntityType } from "./entities";

// Comentarios e historial de tareas, proyectos, ideas, pedidos, contenido y problemas de Sistemas.

const COMMENT_MAX = 2000;

const COMMENT_SELECT = `
  id, body, created_at, author_id,
  author:profiles!author_id(id, full_name, color)
`;

// De dónde sale el título de cada tipo y a quién se le avisa cuando alguien comenta.
const ENTITIES: Record<CommentEntityType, { table: string; titleColumn: string; peopleColumns: string[] }> = {
  task: { table: "tasks", titleColumn: "title", peopleColumns: ["assignee_id", "creator_id"] },
  project: { table: "projects", titleColumn: "name", peopleColumns: ["owner_id", "created_by"] },
  idea: { table: "ideas", titleColumn: "title", peopleColumns: ["creator_id"] },
  dependency: { table: "dependencies", titleColumn: "title", peopleColumns: ["requester_id", "provider_id"] },
  content_item: { table: "content_items", titleColumn: "title", peopleColumns: ["assignee_id", "creator_id"] },
  system_issue: { table: "system_issues", titleColumn: "title", peopleColumns: ["reporter_id", "assignee_id"] },
};

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
  author: { id: string; full_name: string; color: string } | null;
}

function toComment(row: CommentRow, meId: string): CommentItem {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    author: row.author
      ? { id: row.author.id, fullName: row.author.full_name, color: row.author.color }
      : null,
    mine: row.author_id === meId,
  };
}

export async function getComments(entityType: string, entityId: string): Promise<CommentsResult> {
  if (!isCommentEntityType(entityType) || !isUuid(entityId)) return { ok: false, error: "Elemento inválido." };

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) {
    console.error("[comentarios] No se pudieron cargar:", error.message);
    return { ok: false, error: "No se pudieron cargar los comentarios." };
  }

  return { ok: true, comments: ((data ?? []) as unknown as CommentRow[]).map((row) => toComment(row, me.id)) };
}

export async function addComment(entityType: string, entityId: string, rawBody: unknown): Promise<AddCommentResult> {
  if (!isCommentEntityType(entityType) || !isUuid(entityId)) return { ok: false, error: "Elemento inválido." };
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (!body) return { ok: false, error: "Escribí un comentario." };
  if (body.length > COMMENT_MAX) {
    return { ok: false, error: `El comentario es muy largo (máximo ${COMMENT_MAX} caracteres).` };
  }

  const me = await getCurrentUser();
  const supabase = await createClient();
  const config = ENTITIES[entityType];

  const { data: target } = await supabase
    .from(config.table)
    .select([config.titleColumn, ...config.peopleColumns].join(", "))
    .eq("id", entityId)
    .maybeSingle();
  if (!target) return { ok: false, error: "No encontramos el elemento. Puede que ya lo hayan eliminado." };
  const row = target as unknown as Record<string, string | null>;

  const { data, error } = await supabase
    .from("comments")
    .insert({ entity_type: entityType, entity_id: entityId, author_id: me.id, body })
    .select(COMMENT_SELECT)
    .single();
  if (error || !data) {
    console.error("[comentarios] No se pudo guardar:", error?.message);
    return { ok: false, error: "No se pudo publicar el comentario. Probá de nuevo." };
  }

  const entity = { type: entityType, id: entityId, title: row[config.titleColumn] ?? "" };
  await logActivity(supabase, me.id, "comento", entity);

  // Se avisa a las personas a cargo (sin duplicar y sin avisarme a mí mismo).
  const recipients = new Set(
    config.peopleColumns.map((column) => row[column]).filter((id): id is string => !!id && id !== me.id),
  );
  for (const userId of recipients) {
    await sendNotification(supabase, {
      userId,
      actorId: me.id,
      type: "comentario",
      entity,
      message: `${me.name} comentó en ${entity.title}.`,
    });
  }

  return { ok: true, comment: toComment(data as unknown as CommentRow, me.id) };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  if (!isUuid(commentId)) return { ok: false, error: "Comentario inválido." };

  const me = await getCurrentUser();
  const supabase = await createClient();

  // Solo se pueden borrar los propios (la base también lo exige).
  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("author_id", me.id);
  if (error) {
    console.error("[comentarios] No se pudo borrar:", error.message);
    return { ok: false, error: "No se pudo borrar el comentario. Probá de nuevo." };
  }
  return { ok: true };
}

export async function getActivity(
  entityType: string,
  entityId: string,
): Promise<{ ok: true; items: ActivityItem[] } | { ok: false; error: string }> {
  if (!isCommentEntityType(entityType) || !isUuid(entityId)) return { ok: false, error: "Elemento inválido." };

  await getCurrentUser(); // verifica que haya sesión
  try {
    return { ok: true, items: await getEntityActivity(entityType, entityId) };
  } catch (error) {
    console.error("[actividad]", error);
    return { ok: false, error: "No se pudo cargar el historial." };
  }
}
