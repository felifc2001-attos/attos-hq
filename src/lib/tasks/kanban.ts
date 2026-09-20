// Lógica del tablero Kanban: dónde queda una tarjeta al soltarla.
// El orden dentro de una columna se guarda en `tasks.position` (un número decimal):
// al insertar entre dos tarjetas se usa el punto medio, así no hay que renumerar las demás.

export interface Positioned {
  id: string;
  status: string;
  position: number;
}

export function sortByPosition<T extends { position: number }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => a.position - b.position);
}

/** Posición para insertar entre `prev` y `next` (cualquiera puede faltar). */
export function positionBetween(prev?: number, next?: number): number {
  if (prev !== undefined && next !== undefined) return (prev + next) / 2;
  if (next !== undefined) return next - 1;
  if (prev !== undefined) return prev + 1;
  return Date.now() / 1000; // misma escala que el valor por defecto de la base (segundos desde 1970)
}

/** Posición para ubicar una tarea al final de una columna. */
export function positionAtEnd(tasks: Positioned[], status: string, excludeId?: string): number {
  const column = sortByPosition(tasks.filter((task) => task.status === status && task.id !== excludeId));
  return positionBetween(column.at(-1)?.position, undefined);
}

export interface MovePlan {
  status: string;
  position: number;
}

/**
 * Calcula el nuevo estado y posición de la tarjeta `draggedId` al soltarla sobre `overId`
 * (otra tarjeta, o una columna vacía identificada por su estado).
 * `placeAfter`: se soltó en la mitad de abajo de la tarjeta de destino.
 * Devuelve null si no hay nada que cambiar.
 */
export function planMove(
  tasks: Positioned[],
  draggedId: string,
  overId: string,
  placeAfter: boolean,
  statuses: readonly string[],
): MovePlan | null {
  const dragged = tasks.find((task) => task.id === draggedId);
  if (!dragged || overId === draggedId) return null;

  const overTask = tasks.find((task) => task.id === overId);
  const targetStatus = overTask ? overTask.status : statuses.includes(overId) ? overId : null;
  if (!targetStatus) return null;

  // La columna de destino sin la tarjeta que se está moviendo.
  const column = sortByPosition(tasks.filter((task) => task.status === targetStatus && task.id !== draggedId));
  const index = overTask
    ? column.findIndex((task) => task.id === overTask.id) + (placeAfter ? 1 : 0)
    : column.length;

  if (dragged.status === targetStatus) {
    const currentIndex = sortByPosition(tasks.filter((task) => task.status === targetStatus)).findIndex(
      (task) => task.id === draggedId,
    );
    if (currentIndex === index) return null; // quedó en el mismo lugar
  }

  return { status: targetStatus, position: positionBetween(column[index - 1]?.position, column[index]?.position) };
}
