import type { Metadata } from "next";
import Link from "next/link";
import { Handshake } from "lucide-react";
import { DeepLink } from "@/components/layout/deep-link";
import { PageHeader } from "@/components/layout/page-header";
import { CreateButton } from "@/components/quick-create/create-button";
import { RequestCard } from "@/components/requests/request-card";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { todayISO } from "@/lib/dates";
import { getRequestById, getRequests } from "@/lib/dependencies/queries";
import { REQUEST_VIEWS, parseRequestView, requestViewQuery, splitRequests } from "@/lib/dependencies/split";
import { isUuid } from "@/lib/tasks/validate";
import { cn } from "@/lib/utils";

const EMPTY: Record<string, { title: string; hint: string }> = {
  recibidos: { title: "Nadie te está esperando.", hint: "Cuando alguien necesite algo de vos, aparece acá." },
  enviados: {
    title: "No estás esperando nada de nadie.",
    hint: "Si necesitás algo de alguien, creá un pedido con el botón de arriba.",
  },
  entregados: { title: "Todavía no hay pedidos entregados.", hint: "Los que se van entregando quedan acá como historial." },
};

export const metadata: Metadata = { title: "Necesito de…" };

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const view = parseRequestView(params);
  const linkedId = Array.isArray(params.pedido) ? params.pedido[0] : params.pedido;

  const me = await getCurrentUser();
  const today = todayISO();

  const [items, linked] = await Promise.all([
    getRequests(me.id),
    // Enlace directo (desde una notificación): puede ser un pedido viejo que no está en las listas.
    isUuid(linkedId) ? getRequestById(linkedId) : Promise.resolve(null),
  ]);
  const split = splitRequests(items, me.id);
  const shown = split[view];

  return (
    <>
      <PageHeader
        title="Necesito de…"
        subtitle="Lo que necesitás de otros y lo que otros necesitan de vos."
        actions={<CreateButton kind="dependency" label="Nuevo pedido" />}
      />

      {linked && <DeepLink request={linked} cleanHref={`/pedidos${requestViewQuery(view)}`} />}
      {linkedId && !linked && (
        <p role="status" className="mb-6 rounded-xl bg-beige-deep/60 px-4 py-3 text-sm text-muted">
          Ese pedido ya no existe. Puede que lo hayan cancelado.
        </p>
      )}

      <nav aria-label="Qué pedidos ver" className="mb-6 inline-flex flex-wrap rounded-full border border-line bg-surface p-1">
        {REQUEST_VIEWS.map((option) => (
          <Link
            key={option.value}
            href={`/pedidos${requestViewQuery(option.value)}`}
            aria-current={view === option.value ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              view === option.value ? "bg-bordo text-beige shadow-card" : "text-muted hover:text-ink",
            )}
          >
            {option.label} ({split[option.value].length})
          </Link>
        ))}
      </nav>

      {shown.length > 0 ? (
        <div className="space-y-3">
          {shown.map((request) => (
            <RequestCard key={request.id} request={request} meId={me.id} today={today} />
          ))}
        </div>
      ) : (
        <Card className="mx-auto max-w-xl p-10 text-center">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-bordo-soft text-bordo">
            <Handshake className="size-7" aria-hidden />
          </span>
          <p className="mt-4 font-semibold text-ink">{EMPTY[view].title}</p>
          <p className="mt-1 text-sm text-muted">{EMPTY[view].hint}</p>
        </Card>
      )}
    </>
  );
}
