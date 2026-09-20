// Los tipos de aviso que se pueden silenciar desde Configuración. Los valores son los del tipo `notification_type` de la base.

export const NOTIFICATION_TYPES = [
  { value: "asignacion", label: "Asignaciones", description: "Cuando te asignan una tarea, un proyecto, contenido o un problema." },
  { value: "comentario", label: "Comentarios", description: "Cuando alguien comenta algo tuyo." },
  { value: "pedido_nuevo", label: "Pedidos nuevos", description: "Cuando alguien necesita algo de vos (“Necesito de…”)." },
  { value: "pedido_entregado", label: "Pedidos entregados", description: "Cuando te entregan lo que pediste." },
  { value: "aprobacion_solicitada", label: "Pedidos de aprobación", description: "Cuando hay contenido esperando que lo apruebes." },
  { value: "aprobacion_resuelta", label: "Resultado de aprobaciones", description: "Cuando aprueban o piden cambios en tu contenido." },
  { value: "vence_pronto", label: "Vencimientos", description: "El aviso de las 8:00 con las tareas que vencen hoy o mañana." },
  { value: "problema_resuelto", label: "Problemas resueltos", description: "Cuando resuelven un problema que reportaste." },
] as const;

export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number]["value"];

export function isNotificationType(value: unknown): value is NotificationTypeValue {
  return NOTIFICATION_TYPES.some((type) => type.value === value);
}

/** Los tipos silenciados que llegan del formulario: una lista de tipos válidos, sin repetidos. */
export function parseMutedTypes(raw: unknown): { ok: true; value: NotificationTypeValue[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: "Datos inválidos." };
  if (!raw.every(isNotificationType)) return { ok: false, error: "Hay un tipo de aviso que no es válido." };
  return { ok: true, value: [...new Set(raw)] };
}
