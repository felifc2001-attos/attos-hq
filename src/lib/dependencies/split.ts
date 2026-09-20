import type { RequestItem } from "./types";

export const REQUEST_VIEWS = [
  { value: "recibidos", label: "Te piden" },
  { value: "enviados", label: "Pediste" },
  { value: "entregados", label: "Entregados" },
] as const;

export type RequestView = (typeof REQUEST_VIEWS)[number]["value"];

export const DEFAULT_REQUEST_VIEW: RequestView = "recibidos";

export function parseRequestView(params: Record<string, string | string[] | undefined>): RequestView {
  const raw = Array.isArray(params.ver) ? params.ver[0] : params.ver;
  return REQUEST_VIEWS.find((view) => view.value === raw)?.value ?? DEFAULT_REQUEST_VIEW;
}

export function requestViewQuery(view: RequestView): string {
  return view === DEFAULT_REQUEST_VIEW ? "" : `?ver=${view}`;
}

export interface SplitRequests {
  /** Pendientes que me piden a mí. */
  recibidos: RequestItem[];
  /** Pendientes que pedí yo. */
  enviados: RequestItem[];
  /** Ya entregados en los que participo, el más reciente primero. */
  entregados: RequestItem[];
}

// Lo que vence antes va primero; los pedidos sin fecha, al final, del más viejo al más nuevo.
function byDueThenAge(a: RequestItem, b: RequestItem): number {
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.createdAt.localeCompare(b.createdAt);
}

/** Reparte los pedidos en las tres listas de la pantalla, desde el punto de vista de `meId`. */
export function splitRequests(items: RequestItem[], meId: string): SplitRequests {
  const pending = items.filter((item) => item.status === "pendiente");
  return {
    recibidos: pending.filter((item) => item.providerId === meId).sort(byDueThenAge),
    enviados: pending.filter((item) => item.requesterId === meId).sort(byDueThenAge),
    entregados: items
      .filter((item) => item.status === "entregado" && (item.providerId === meId || item.requesterId === meId))
      .sort((a, b) => (b.deliveredAt ?? "").localeCompare(a.deliveredAt ?? "")),
  };
}
