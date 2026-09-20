import "server-only";

import type { CommentEntityType } from "@/lib/comments/entities";
import { createClient } from "@/lib/supabase/server";
import type { ActivityItem } from "./describe";

const ACTIVITY_SELECT = `
  id, action, entity_type, entity_id, entity_title, metadata, created_at,
  actor:profiles!actor_id(id, full_name, color)
`;

interface ActivityRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: { id: string; full_name: string; color: string } | null;
}

function toItem(row: ActivityRow): ActivityItem {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityTitle: row.entity_title,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    actor: row.actor
      ? { id: row.actor.id, fullName: row.actor.full_name, color: row.actor.color }
      : null,
  };
}

/** Lo último que hizo el equipo, de cualquier sección (para el Inicio). */
export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`No se pudo cargar la actividad: ${error.message}`);
  return ((data ?? []) as unknown as ActivityRow[]).map(toItem);
}

/** Lo último que hizo una persona, de cualquier sección (para su perfil). */
export async function getActivityByActor(actorId: string, limit = 8): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`No se pudo cargar la actividad: ${error.message}`);
  return ((data ?? []) as unknown as ActivityRow[]).map(toItem);
}

/** El historial de un elemento puntual (por ejemplo, una tarea), del más nuevo al más viejo. */
export async function getEntityActivity(
  entityType: CommentEntityType,
  entityId: string,
  limit = 50,
): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`No se pudo cargar el historial: ${error.message}`);
  return ((data ?? []) as unknown as ActivityRow[]).map(toItem);
}
