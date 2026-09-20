import type { ActivityItem } from "../activity/describe";
import type { Area } from "../tasks/constants";
import type { Task } from "../tasks/types";
import type { NotificationTypeValue } from "../notifications/preferences";

export interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  /** El texto que se muestra ("Comercial & Operaciones"). */
  area: string;
  defaultArea: Area | null;
  color: string;
}

/** Los números de la parte de arriba de un perfil. */
export interface ProfileStats {
  openTasks: number;
  overdueTasks: number;
  doneThisWeek: number;
  activeProjects: number;
  /** Pedidos "Necesito de…" que le hicieron y todavía no entregó. */
  pendingRequests: number;
}

export interface ProfileProject {
  id: string;
  name: string;
  status: string;
}

/** Todo lo que muestra la página de una persona. */
export interface ProfileOverview {
  profile: ProfileData;
  stats: ProfileStats;
  /** Sus tareas sin terminar más urgentes. */
  tasks: Task[];
  projects: ProfileProject[];
  activity: ActivityItem[];
}

export interface NotificationPreferences {
  /** false si todavía falta ejecutar el archivo de la Etapa 9 en Supabase. */
  available: boolean;
  muted: NotificationTypeValue[];
}
