"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  ClipboardCheck,
  Clock,
  Handshake,
  MessageCircle,
  PackageCheck,
  UserCheck,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { PersonAvatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/dates";
import { deleteNotification, markNotificationRead } from "@/lib/notifications/actions";
import { notificationHref } from "@/lib/notifications/links";
import type { NotificationItem as Item } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  asignacion: UserCheck,
  comentario: MessageCircle,
  pedido_nuevo: Handshake,
  pedido_entregado: PackageCheck,
  aprobacion_solicitada: ClipboardCheck,
  aprobacion_resuelta: BadgeCheck,
  vence_pronto: Clock,
  problema_resuelto: Wrench,
};

export function NotificationItem({ item }: { item: Item }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const unread = item.readAt === null;
  const href = notificationHref(item.entityType, item.entityId);
  const Icon = ICONS[item.type] ?? MessageCircle;

  function run(action: () => ReturnType<typeof markNotificationRead>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
          unread ? "bg-bordo-soft text-bordo" : "bg-beige text-muted",
        )}
      >
        <Icon className="size-[1.1rem]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm", unread ? "font-semibold text-ink" : "text-ink/80")}>{item.message}</span>
        <span className="mt-1 flex items-center gap-2 text-xs text-muted">
          {item.actor && <PersonAvatar person={item.actor} size="sm" className="size-5 text-[0.6rem]" />}
          {formatRelativeTime(item.createdAt)}
        </span>
      </span>
    </>
  );

  return (
    <li className={cn("flex items-start gap-1 px-2 py-1 sm:px-3", unread && "bg-bordo-soft/25")}>
      {href ? (
        <Link
          href={href}
          // Al abrirla se marca como leída (la acción y la navegación se encolan, no se pisan).
          onClick={() => {
            if (unread) run(() => markNotificationRead(item.id));
          }}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-beige/70"
        >
          {content}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3 px-2 py-2.5">{content}</div>
      )}

      <div className="flex shrink-0 items-center pt-2.5">
        {unread && (
          <>
            <span className="mr-1 size-2 rounded-full bg-bordo" aria-hidden />
            <button
              type="button"
              onClick={() => run(() => markNotificationRead(item.id))}
              disabled={pending}
              aria-label="Marcar como leída"
              title="Marcar como leída"
              className="inline-flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-beige hover:text-st-done disabled:opacity-50"
            >
              <Check className="size-4" aria-hidden />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => run(() => deleteNotification(item.id))}
          disabled={pending}
          aria-label="Borrar notificación"
          title="Borrar"
          className="inline-flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-beige hover:text-prio-urgent disabled:opacity-50"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {error && (
        <p role="alert" className="sr-only">
          {error}
        </p>
      )}
    </li>
  );
}
