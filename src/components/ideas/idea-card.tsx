"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, Rocket, SquareCheckBig, ThumbsUp } from "lucide-react";
import { PersonAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/dates";
import { toggleIdeaVote } from "@/lib/ideas/actions";
import { isConverted } from "@/lib/ideas/filters";
import type { IdeaItem } from "@/lib/ideas/types";
import { AREAS } from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";
import { useIdeaDialog } from "./idea-dialog";

export function IdeaCard({ idea }: { idea: IdeaItem }) {
  const { open } = useIdeaDialog();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // El voto se marca al instante; si el servidor falla, vuelve solo al valor anterior y se avisa.
  const [vote, toggleVote] = useOptimistic(
    { voted: idea.votedByMe, count: idea.votes },
    (current) => ({
      voted: !current.voted,
      count: current.count + (current.voted ? -1 : 1),
    }),
  );

  function onVote() {
    setError(null);
    startTransition(async () => {
      toggleVote(null);
      const result = await toggleIdeaVote(idea.id);
      if (!result.ok) setError(result.error);
    });
  }

  const area = AREAS.find((option) => option.value === idea.area);

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => open(idea)}
          className="min-w-0 flex-1 text-left font-display text-lg font-semibold leading-snug text-ink transition hover:text-bordo"
        >
          {idea.title}
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={vote.voted}
          aria-label={vote.voted ? "Quitar mi voto" : "Votar esta idea"}
          onClick={onVote}
          className={cn(
            "inline-flex shrink-0 flex-col items-center rounded-2xl border px-3 py-1.5 text-xs font-bold transition active:scale-95",
            vote.voted
              ? "border-bordo bg-bordo text-beige"
              : "border-line bg-surface text-muted hover:border-bordo hover:text-bordo",
          )}
        >
          <ThumbsUp className={cn("size-4", vote.voted && "fill-current")} aria-hidden />
          {vote.count}
        </button>
      </div>

      {idea.description && <p className="line-clamp-4 text-sm text-muted">{idea.description}</p>}

      {(area || idea.labels.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {area && <Badge tone="wine">{area.label}</Badge>}
          {idea.labels.map((label) => (
            <span key={label.id} className="inline-flex items-center gap-1 text-xs text-muted">
              <span className="size-2 rounded-full" style={{ backgroundColor: label.color }} aria-hidden />
              {label.name}
            </span>
          ))}
        </div>
      )}

      {isConverted(idea) && (
        <p className="flex items-center gap-1.5 rounded-xl bg-st-done/10 px-3 py-2 text-xs font-semibold text-st-done">
          {idea.convertedProject ? (
            <>
              <Rocket className="size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">
                Ahora es el proyecto{" "}
                <Link href={`/proyectos/${idea.convertedProject.id}`} className="underline underline-offset-2">
                  {idea.convertedProject.name}
                </Link>
              </span>
            </>
          ) : (
            <>
              <SquareCheckBig className="size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">Ahora es la tarea {idea.convertedTask?.title}</span>
            </>
          )}
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-prio-urgent">
          {error}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-1 text-xs text-muted">
        <PersonAvatar person={idea.creator} size="sm" />
        <span className="min-w-0 flex-1 truncate">
          {idea.creator?.fullName ?? "Alguien"} · {formatRelativeTime(idea.createdAt)}
        </span>
        <button
          type="button"
          onClick={() => open(idea)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold transition hover:bg-beige hover:text-ink"
          aria-label={`${idea.commentCount} comentarios. Abrir la idea`}
        >
          <MessageCircle className="size-4" aria-hidden />
          {idea.commentCount}
        </button>
      </div>
    </Card>
  );
}
