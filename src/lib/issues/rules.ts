import { RESOLVED_STATUS, type IssueStatus } from "./constants";

export interface IssueStatusPlan {
  /** ¿Cambia de columna? */
  changed: boolean;
  /** "set": queda resuelto ahora; "clear": se reabre; "keep": no se toca la fecha de resolución. */
  resolved: "set" | "clear" | "keep";
  /** Hay que avisarle a quien lo reportó que ya está resuelto. */
  notifyReporter: boolean;
}

/** Qué pasa al llevar un problema de una columna a otra: al llegar a producción se da por resuelto; al salir, se reabre. */
export function planIssueStatus(from: IssueStatus, to: IssueStatus): IssueStatusPlan {
  if (from === to) return { changed: false, resolved: "keep", notifyReporter: false };
  if (to === RESOLVED_STATUS) return { changed: true, resolved: "set", notifyReporter: true };
  if (from === RESOLVED_STATUS) return { changed: true, resolved: "clear", notifyReporter: false };
  return { changed: true, resolved: "keep", notifyReporter: false };
}
