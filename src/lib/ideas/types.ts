import type { Area } from "../tasks/constants";
import type { Person, TaskLabel } from "../tasks/types";

export interface IdeaItem {
  id: string;
  title: string;
  description: string | null;
  area: Area | null;
  createdAt: string;
  creator: Person | null;
  votes: number;
  /** ¿Ya voté esta idea? */
  votedByMe: boolean;
  commentCount: number;
  labels: TaskLabel[];
  /** Si la idea ya se convirtió, en qué. Una idea se convierte una sola vez. */
  convertedTask: { id: string; title: string } | null;
  convertedProject: { id: string; name: string } | null;
}
