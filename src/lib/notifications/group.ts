import { dateInAR, diffDays } from "../dates";

export interface DayGroup<T> {
  label: "Hoy" | "Ayer" | "Anteriores";
  items: T[];
}

/** Agrupa (en el orden recibido) por día de Argentina: hoy, ayer y el resto. */
export function groupByDay<T extends { createdAt: string }>(items: T[], today: string): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];

  for (const item of items) {
    const diff = diffDays(today, dateInAR(item.createdAt));
    const label = diff <= 0 ? "Hoy" : diff === 1 ? "Ayer" : "Anteriores";
    let group = groups.find((candidate) => candidate.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
}
