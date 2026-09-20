"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { PersonAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { textareaClass } from "@/components/ui/form-controls";
import { addComment, deleteComment, getComments } from "@/lib/comments/actions";
import type { CommentEntityType } from "@/lib/comments/entities";
import { formatRelativeTime } from "@/lib/dates";
import type { CommentItem } from "@/lib/tasks/types";

interface EntityCommentsProps {
  entityType: CommentEntityType;
  entityId: string;
  /** Alto máximo de la lista antes de que aparezca scroll. */
  listClassName?: string;
}

// Conversación de una tarea, un proyecto o una idea.
export function EntityComments({ entityType, entityId, listClassName = "max-h-80" }: EntityCommentsProps) {
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    let cancelled = false;
    getComments(entityType, entityId).then(
      (result) => {
        if (cancelled) return;
        if (result.ok) setComments(result.comments);
        else setLoadError(result.error);
      },
      () => {
        if (!cancelled) setLoadError("No se pudieron cargar los comentarios.");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  // Al llegar un comentario nuevo, se muestra el final de la conversación.
  const count = comments?.length ?? 0;
  useEffect(() => {
    if (count > 0) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [count]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addComment(entityType, entityId, draft);
      if (result.ok) {
        setComments((current) => [...(current ?? []), result.comment]);
        setDraft("");
      } else {
        setError(result.error);
      }
    });
  }

  function remove(comment: CommentItem) {
    if (!window.confirm("¿Borrar este comentario?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (result.ok) setComments((current) => (current ?? []).filter((item) => item.id !== comment.id));
      else setError(result.error);
    });
  }

  return (
    <div>
      {loadError ? (
        <p role="alert" className="rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
          {loadError}
        </p>
      ) : comments === null ? (
        <p className="py-8 text-center text-sm text-muted">Cargando comentarios…</p>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Todavía no hay comentarios. Escribí el primero.</p>
      ) : (
        <ul className={`${listClassName} space-y-4 overflow-y-auto pr-1`}>
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <PersonAvatar person={comment.author} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2 text-sm">
                  <span className="font-semibold text-ink">{comment.author?.fullName ?? "Alguien"}</span>
                  <span className="text-xs text-muted">{formatRelativeTime(comment.createdAt)}</span>
                  {comment.mine && (
                    <button
                      type="button"
                      onClick={() => remove(comment)}
                      disabled={pending}
                      aria-label="Borrar mi comentario"
                      className="ml-auto text-muted transition hover:text-prio-urgent disabled:opacity-50"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  )}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink">{comment.body}</p>
              </div>
            </li>
          ))}
          <li ref={endRef} aria-hidden />
        </ul>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3 border-t border-line pt-4">
        <label className="block">
          <span className="sr-only">Escribir un comentario</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Ctrl/Cmd + Enter publica, como en la mayoría de los chats.
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") event.currentTarget.form?.requestSubmit();
            }}
            rows={3}
            maxLength={2000}
            placeholder="Escribí un comentario…"
            className={textareaClass}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">Ctrl + Enter para publicar</span>
          <Button type="submit" size="sm" disabled={pending || !draft.trim()}>
            {pending ? "Publicando…" : "Comentar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
