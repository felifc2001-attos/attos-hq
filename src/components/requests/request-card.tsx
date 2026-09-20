"use client";

import { Lock } from "lucide-react";
import { RequestActions } from "@/components/home/request-actions";
import { PersonAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDueLabel, formatRelativeTime } from "@/lib/dates";
import type { RequestItem } from "@/lib/dependencies/types";
import { cn } from "@/lib/utils";
import { useRequestDialog } from "./request-dialog";

interface RequestCardProps {
  request: RequestItem;
  meId: string;
  today: string;
}

export function RequestCard({ request, meId, today }: RequestCardProps) {
  const { open } = useRequestDialog();

  const incoming = request.providerId === meId; // me lo piden a mí
  const other = incoming ? request.requester : request.provider;
  const pending = request.status === "pendiente";
  const overdue = pending && request.dueDate !== null && request.dueDate < today;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <PersonAvatar person={other} size="sm" />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => open(request)}
            className="block max-w-full text-left text-[0.95rem] font-semibold leading-snug text-ink transition hover:text-bordo"
          >
            {request.title}
          </button>

          <p className="mt-1 text-xs text-muted">
            {incoming ? "Te lo pide" : "Se lo pediste a"} {other?.fullName ?? "alguien"}
            {pending && request.dueDate && (
              <>
                {" · "}
                <span className={cn("font-semibold", overdue && "text-prio-urgent")}>
                  {formatDueLabel(request.dueDate, today)}
                </span>
              </>
            )}
            {!pending && request.deliveredAt && ` · entregado ${formatRelativeTime(request.deliveredAt)}`}
          </p>

          {request.task && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-prio-high">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                {pending ? "Frena" : "Frenaba"} la tarea: {request.task.title}
              </span>
            </p>
          )}
        </div>

        {pending && <RequestActions id={request.id} direction={incoming ? "incoming" : "outgoing"} />}
      </div>
    </Card>
  );
}
