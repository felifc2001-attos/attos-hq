"use client";

import { useRealtimeStatus, type RealtimeStatus } from "@/components/realtime/realtime-provider";
import { cn } from "@/lib/utils";

const COPY: Record<RealtimeStatus, { label: string; detail: string; dot: string }> = {
  live: {
    label: "Conectado",
    detail: "Los cambios de tus compañeros aparecen solos, sin recargar.",
    dot: "bg-st-done",
  },
  connecting: {
    label: "Conectando…",
    detail: "En un momento empiezan a llegar los cambios en vivo.",
    dot: "bg-prio-high",
  },
  offline: {
    label: "Sin conexión en vivo",
    detail: "Los cambios de otras personas se ven al recargar la página. Se reintenta solo.",
    dot: "bg-prio-urgent",
  },
};

/** Si la actualización en vivo está funcionando. */
export function LiveStatus() {
  const status = useRealtimeStatus();
  const { label, detail, dot } = COPY[status];

  return (
    <div className="flex items-start gap-3" role="status">
      <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", dot, status === "connecting" && "animate-pulse")} aria-hidden />
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-sm text-muted">{detail}</p>
      </div>
    </div>
  );
}
