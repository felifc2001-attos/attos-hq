import type { Person, Task } from "../tasks/types";

export interface PersonGroup {
  /** null = tareas sin asignar. */
  person: Person | null;
  open: Task[];
  done: Task[];
}

/**
 * Reparte las tareas de un proyecto por persona: pendientes y terminadas por separado.
 * Las personas van en orden alfabético y "sin asignar" al final.
 * Se asume que `tasks` ya viene ordenada (por fecha y prioridad).
 */
export function groupTasksByPerson(tasks: Task[]): PersonGroup[] {
  const groups = new Map<string, PersonGroup>();

  for (const task of tasks) {
    const key = task.assignee?.id ?? "sin-asignar";
    let group = groups.get(key);
    if (!group) {
      group = { person: task.assignee, open: [], done: [] };
      groups.set(key, group);
    }
    (task.status === "listo" ? group.done : group.open).push(task);
  }

  return [...groups.values()].sort((a, b) => {
    if (!a.person) return 1;
    if (!b.person) return -1;
    return a.person.fullName.localeCompare(b.person.fullName, "es");
  });
}
