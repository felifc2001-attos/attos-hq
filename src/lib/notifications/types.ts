import type { Person } from "../tasks/types";

export interface NotificationItem {
  id: string;
  /** Valor del tipo `notification_type` de la base (asignacion, comentario, pedido_nuevo…). */
  type: string;
  entityType: string | null;
  entityId: string | null;
  message: string;
  readAt: string | null;
  createdAt: string;
  /** Quien la provocó; vacío en avisos automáticos (por ejemplo, vencimientos). */
  actor: Person | null;
}
