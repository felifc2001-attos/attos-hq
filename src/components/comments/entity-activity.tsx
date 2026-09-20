"use client";

import { useEffect, useState } from "react";
import { PersonAvatar } from "@/components/ui/avatar";
import { describeActivity, type ActivityItem } from "@/lib/activity/describe";
import { getActivity } from "@/lib/comments/actions";
import { ENTITY_SUBJECT, type CommentEntityType } from "@/lib/comments/entities";
import { formatRelativeTime } from "@/lib/dates";

interface EntityActivityProps {
  entityType: CommentEntityType;
  entityId: string;
  listClassName?: string;
}

// Historial de una tarea, un proyecto o una idea: quién hizo qué y cuándo.
export function EntityActivity({ entityType, entityId, listClassName = "max-h-96" }: EntityActivityProps) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActivity(entityType, entityId).then(
      (result) => {
        if (cancelled) return;
        if (result.ok) setItems(result.items);
        else setError(result.error);
      },
      () => {
        if (!cancelled) setError("No se pudo cargar el historial.");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
        {error}
      </p>
    );
  }
  if (items === null) return <p className="py-8 text-center text-sm text-muted">Cargando historial…</p>;
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Todavía no hay actividad registrada acá.</p>;
  }

  return (
    <ul className={`${listClassName} space-y-4 overflow-y-auto pr-1`}>
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <PersonAvatar person={item.actor} size="sm" />
          <p className="min-w-0 flex-1 pt-1 text-sm text-ink">
            <strong className="font-semibold">{item.actor?.fullName ?? "Alguien"}</strong>{" "}
            {describeActivity(item.action, item.metadata, ENTITY_SUBJECT[entityType])}.
          </p>
          <span className="shrink-0 pt-1.5 text-xs text-muted">{formatRelativeTime(item.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
