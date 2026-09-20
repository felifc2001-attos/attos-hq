import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { NotificationItem } from "./types";

const NOTIFICATION_SELECT = `
  id, type, entity_type, entity_id, message, read_at, created_at,
  actor:profiles!actor_id(id, full_name, color)
`;

interface NotificationRow {
  id: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
  actor: { id: string; full_name: string; color: string } | null;
}

/** Mis notificaciones, la más nueva primero. Las de otras personas no se pueden leer (lo garantiza la base). */
export async function getNotifications(meId: string, onlyUnread: boolean): Promise<NotificationItem[]> {
  const supabase = await createClient();

  let query = supabase.from("notifications").select(NOTIFICATION_SELECT).eq("user_id", meId);
  if (onlyUnread) query = query.is("read_at", null);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(`No se pudieron cargar las notificaciones: ${error.message}`);

  return ((data ?? []) as unknown as NotificationRow[]).map((row) => ({
    id: row.id,
    type: row.type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    message: row.message,
    readAt: row.read_at,
    createdAt: row.created_at,
    actor: row.actor
      ? { id: row.actor.id, fullName: row.actor.full_name, color: row.actor.color }
      : null,
  }));
}

export async function getUnreadCount(meId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", meId)
    .is("read_at", null);
  if (error) throw new Error(`No se pudieron contar las notificaciones: ${error.message}`);
  return count ?? 0;
}
