import { PRIORITY_RANK } from "./constants";
import { addDays } from "../dates";
import type { Task } from "./types";

export interface MyDay {
  /** Lo que vence hoy, lo más importante primero. */
  today: Task[];
  overdue: Task[];
  /** Esperando revisión: mías en "Para revisar", o de otros que me toca revisar a mí. */
  review: Task[];
  /** Vencen en los próximos 7 días. */
  upcoming: Task[];
  /** Mías, esperando algo de otra persona. */
  blocked: Task[];
}

/** Fecha más cercana primero (sin fecha al final); a igual fecha, más prioritaria primero. */
export function compareByDueThenPriority(a: Task, b: Task): number {
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || a.title.localeCompare(b.title, "es");
}

function compareByPriority(a: Task, b: Task): number {
  return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || compareByDueThenPriority(a, b);
}

/**
 * Reparte las tareas de una persona en las secciones de "Mi día".
 * @param open tareas asignadas a la persona que todavía no están listas
 * @param reviewCandidates tareas en "Para revisar" donde la persona es quien las hace o quien las creó
 * @param today día de hoy (YYYY-MM-DD)
 */
export function bucketMyDay(open: Task[], reviewCandidates: Task[], today: string): MyDay {
  const weekEnd = addDays(today, 7);

  const review = [...new Map(reviewCandidates.map((task) => [task.id, task])).values()].sort(
    compareByDueThenPriority,
  );

  // Las que están en revisión ya se muestran arriba, no como pendientes.
  const active = open.filter((task) => task.status !== "para_revisar");
  const blocked = active.filter((task) => task.blockedBy.length > 0).sort(compareByDueThenPriority);
  const free = active.filter((task) => task.blockedBy.length === 0);

  return {
    today: free.filter((task) => task.dueDate === today).sort(compareByPriority),
    overdue: free
      .filter((task) => task.dueDate !== null && task.dueDate < today)
      .sort(compareByDueThenPriority),
    upcoming: free
      .filter((task) => task.dueDate !== null && task.dueDate > today && task.dueDate <= weekEnd)
      .sort(compareByDueThenPriority),
    review,
    blocked,
  };
}
