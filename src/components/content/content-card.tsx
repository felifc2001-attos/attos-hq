"use client";

import { CalendarClock, FolderKanban } from "lucide-react";
import { PersonAvatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { CONTENT_FORMATS, labelOf } from "@/lib/content/constants";
import type { ContentItem } from "@/lib/content/types";
import { dateInAR, formatDueLabel, timeInAR } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useContentDialog } from "./content-dialog";

/** La etiqueta de revisión de una tarjeta; nada si todavía no hay nada que decir. */
function reviewBadge(item: ContentItem): { label: string; tone: BadgeTone } | null {
  if (item.reviewStatus === "aprobado") return { label: "Aprobado", tone: "done" };
  if (item.reviewStatus === "cambios_solicitados") return { label: "Cambios pedidos", tone: "urgent" };
  if (item.status === "para_aprobar") return { label: "Esperando aprobación", tone: "review" };
  return null;
}

/** El contenido de una tarjeta del tablero de Contenido. */
export function ContentCard({ item, today }: { item: ContentItem; today: string }) {
  const { open } = useContentDialog();
  const review = reviewBadge(item);
  const publishDay = item.publishAt ? dateInAR(item.publishAt) : null;
  // Pasó su fecha y todavía no salió.
  const late = publishDay !== null && publishDay < today && item.status !== "publicado";

  return (
    <div>
      <button
        type="button"
        onClick={() => open(item)}
        className="block w-full text-left text-sm font-semibold leading-snug text-ink transition hover:text-bordo"
      >
        {item.title}
      </button>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">{labelOf(CONTENT_FORMATS, item.format)}</Badge>
        {review && <Badge tone={review.tone}>{review.label}</Badge>}
      </div>

      {publishDay && item.publishAt && (
        <p className={cn("mt-2.5 flex items-center gap-1.5 text-xs font-semibold", late ? "text-prio-urgent" : "text-muted")}>
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          {formatDueLabel(publishDay, today)} · {timeInAR(item.publishAt)}
          {late && " · atrasada"}
        </p>
      )}

      {item.project && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <FolderKanban className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{item.project.name}</span>
        </p>
      )}

      <div className="mt-3 flex items-center justify-end">
        {item.assignee ? (
          <PersonAvatar person={item.assignee} size="sm" />
        ) : (
          <span
            className="inline-flex size-8 items-center justify-center rounded-full border border-dashed border-line text-xs text-muted"
            title="Sin asignar"
          >
            ?
          </span>
        )}
      </div>
    </div>
  );
}
