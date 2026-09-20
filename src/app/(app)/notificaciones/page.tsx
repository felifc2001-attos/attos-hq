import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { todayISO } from "@/lib/dates";
import { groupByDay } from "@/lib/notifications/group";
import { getNotifications, getUnreadCount } from "@/lib/notifications/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notificaciones" };

export default async function NotificacionesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const showAll = (Array.isArray(params.ver) ? params.ver[0] : params.ver) === "todas";

  const me = await getCurrentUser();
  const today = todayISO();
  const [items, unread] = await Promise.all([getNotifications(me.id, !showAll), getUnreadCount(me.id)]);
  const groups = groupByDay(items, today);

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-semibold transition",
        active ? "bg-bordo text-beige shadow-card" : "text-muted hover:text-ink",
      )}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Notificaciones"
        subtitle="Solo lo que realmente te importa."
        actions={unread > 0 ? <MarkAllReadButton /> : undefined}
      />

      <nav aria-label="Qué notificaciones ver" className="mb-6 inline-flex rounded-full border border-line bg-surface p-1">
        {tab("/notificaciones", unread > 0 ? `Sin leer (${unread})` : "Sin leer", !showAll)}
        {tab("/notificaciones?ver=todas", "Todas", showAll)}
      </nav>

      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted">{group.label}</h2>
              <Card className="overflow-hidden p-1">
                <ul className="divide-y divide-line/70">
                  {group.items.map((item) => (
                    <NotificationItem key={item.id} item={item} />
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      ) : (
        <Card className="mx-auto max-w-xl p-10 text-center">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-bordo-soft text-bordo">
            <Bell className="size-7" aria-hidden />
          </span>
          {showAll ? (
            <>
              <p className="mt-4 font-semibold text-ink">Todavía no tenés notificaciones.</p>
              <p className="mt-1 text-sm text-muted">
                Te avisamos cuando te asignen algo, te comenten o te hagan un pedido.
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 font-semibold text-ink">No tenés nada sin leer.</p>
              <Link
                href="/notificaciones?ver=todas"
                className="mt-2 inline-block text-sm font-semibold text-bordo underline underline-offset-4"
              >
                Ver todas las notificaciones
              </Link>
            </>
          )}
        </Card>
      )}
    </>
  );
}
