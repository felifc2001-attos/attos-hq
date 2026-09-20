import Link from "next/link";
import { Lightbulb, Megaphone, MessageCircle, Monitor, Rocket, SquareCheckBig, type LucideIcon } from "lucide-react";
import { hitStatusLabel } from "@/lib/search/labels";
import { searchHitHref } from "@/lib/search/links";
import { excerpt } from "@/lib/search/text";
import { SEARCH_KINDS, type SearchHit, type SearchKind } from "@/lib/search/types";
import { cn } from "@/lib/utils";
import { Highlight } from "./highlight";

export const SEARCH_KIND_ICONS: Record<SearchKind, LucideIcon> = {
  task: SquareCheckBig,
  project: Rocket,
  idea: Lightbulb,
  content_item: Megaphone,
  system_issue: Monitor,
  comment: MessageCircle,
};

interface SearchResultRowProps {
  hit: SearchHit;
  query: string;
  /** Una sola línea (desplegable del buscador) o con el fragmento de texto donde se encontró (página de resultados). */
  compact?: boolean;
  /** Se llama al hacer clic (por ejemplo, para cerrar el desplegable). */
  onNavigate?: () => void;
  className?: string;
}

/** Un resultado de la búsqueda: lleva a la tarea, proyecto, idea, publicación o problema (o a lo que se comentó). */
export function SearchResultRow({ hit, query, compact, onNavigate, className }: SearchResultRowProps) {
  const Icon = SEARCH_KIND_ICONS[hit.kind];
  const href = searchHitHref(hit);
  const kind = SEARCH_KINDS.find((option) => option.value === hit.kind);
  const status = hitStatusLabel(hit.kind, hit.status);
  const isComment = hit.kind === "comment";

  const primary = isComment ? excerpt(hit.detail ?? "", query, compact ? 40 : 70) : hit.title;
  // En la página completa se muestra el fragmento donde apareció lo buscado, si no estaba ya en el título.
  const snippet = !isComment && !compact && !hit.inTitle && hit.detail ? excerpt(hit.detail, query, 70) : null;
  const context = isComment ? `En: ${hit.title || "algo que ya no existe"}` : status;

  const content = (
    <>
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-bordo-soft text-bordo">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-semibold text-ink", compact && "truncate")}>
          <Highlight text={primary} query={query} />
        </span>
        {snippet && (
          <span className="mt-0.5 block text-xs text-muted">
            <Highlight text={snippet} query={query} />
          </span>
        )}
        <span className="mt-0.5 block truncate text-xs text-muted">
          {!compact && `${kind?.singular ?? ""}${context ? " · " : ""}`}
          {context}
        </span>
      </span>
    </>
  );

  const base = "flex items-start gap-3 rounded-xl px-3 py-2.5";
  if (!href) return <div className={cn(base, "opacity-70", className)}>{content}</div>;
  return (
    <Link href={href} onClick={onNavigate} className={cn(base, "transition hover:bg-beige/70", className)}>
      {content}
    </Link>
  );
}
