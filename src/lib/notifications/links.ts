/**
 * A dónde lleva una notificación al hacer clic.
 * Las tareas, ideas, pedidos, contenido y problemas se abren en una ventana sobre su pantalla, por eso llevan el id en la dirección.
 * Devuelve null si la notificación no apunta a nada.
 */
export function notificationHref(entityType: string | null, entityId: string | null): string | null {
  if (!entityType) return null;
  const id = entityId ? encodeURIComponent(entityId) : null;

  switch (entityType) {
    case "task":
      return id ? `/tareas?tarea=${id}` : "/tareas";
    case "project":
      return id ? `/proyectos/${id}` : "/proyectos";
    case "idea":
      return id ? `/ideas?idea=${id}` : "/ideas";
    case "dependency":
      return id ? `/pedidos?pedido=${id}` : "/pedidos";
    case "system_issue":
      return id ? `/sistemas?problema=${id}` : "/sistemas";
    case "content_item":
      return id ? `/contenido?contenido=${id}` : "/contenido";
    // Los eventos del calendario no tienen una dirección propia: se lleva a la sección.
    case "calendar_event":
      return "/calendario";
    default:
      return null;
  }
}
