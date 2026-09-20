import type { ProjectStatus } from "../quick-create/constants";
import type { Person } from "../tasks/types";

/** Un proyecto con lo necesario para mostrarlo en una tarjeta o en su página. */
export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  owner: Person | null;
  members: Person[];
  startDate: string | null;
  targetDate: string | null;
  /** 0 a 100: automático (tareas listas / tareas totales) o el valor manual, si lo hay. */
  progress: number;
  taskCount: number;
  doneCount: number;
}

/** Lo que necesita el formulario para editar un proyecto. */
export interface EditableProject {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string | null;
  startDate: string | null;
  targetDate: string | null;
  memberIds: string[];
}
