import type { Person } from "../tasks/types";

/** Un pedido "Necesito de…": `requester` necesita algo de `provider`. */
export interface RequestItem {
  id: string;
  title: string;
  description: string | null;
  /** Para cuándo, YYYY-MM-DD. */
  dueDate: string | null;
  status: "pendiente" | "entregado";
  deliveredAt: string | null;
  createdAt: string;
  requesterId: string;
  providerId: string;
  requester: Person | null;
  provider: Person | null;
  /** Tarea que queda bloqueada mientras el pedido esté pendiente. */
  task: { id: string; title: string } | null;
  project: { id: string; name: string } | null;
}
