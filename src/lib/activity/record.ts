import "server-only";

import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ActivityAction =
  | "creo"
  | "actualizo"
  | "movio"
  | "completo"
  | "comento"
  | "aprobo"
  | "solicito_cambios"
  | "entrego";

export type NotificationType =
  | "asignacion"
  | "comentario"
  | "pedido_nuevo"
  | "pedido_entregado"
  | "aprobacion_solicitada"
  | "aprobacion_resuelta"
  | "vence_pronto"
  | "problema_resuelto";

export interface EntityRef {
  type: "task" | "project" | "idea" | "content_item" | "system_issue" | "calendar_event" | "dependency";
  id: string;
  title: string;
}

// El historial y los avisos son secundarios: si fallan, lo principal igual quedó guardado,
// así que solo se deja constancia en el log del servidor.

export async function logActivity(
  supabase: Supabase,
  actorId: string,
  action: ActivityAction,
  entity: EntityRef,
  metadata: Record<string, string> = {},
) {
  const { error } = await supabase.from("activities").insert({
    actor_id: actorId,
    action,
    entity_type: entity.type,
    entity_id: entity.id,
    entity_title: entity.title,
    metadata,
  });
  if (error) console.error("[actividad] No se pudo registrar:", error.message);
}

export async function sendNotification(
  supabase: Supabase,
  notification: {
    userId: string;
    actorId: string;
    type: NotificationType;
    entity: EntityRef;
    message: string;
  },
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: notification.userId,
    actor_id: notification.actorId,
    type: notification.type,
    entity_type: notification.entity.type,
    entity_id: notification.entity.id,
    message: notification.message,
  });
  if (error) console.error("[notificaciones] No se pudo crear:", error.message);
}
