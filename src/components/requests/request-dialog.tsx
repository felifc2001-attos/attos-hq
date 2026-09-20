"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { EntityActivity } from "@/components/comments/entity-activity";
import { EntityComments } from "@/components/comments/entity-comments";
import { FormFooterError, useFormAction } from "@/components/quick-create/shared";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { dateInAR, formatDueLabel, formatShortDate, todayISO } from "@/lib/dates";
import { cancelDependency, deliverDependency } from "@/lib/dependencies/actions";
import type { RequestItem } from "@/lib/dependencies/types";

interface RequestDialogApi {
  open: (request: RequestItem) => void;
}

const RequestDialogContext = createContext<RequestDialogApi | null>(null);

export function useRequestDialog(): RequestDialogApi {
  const api = useContext(RequestDialogContext);
  if (!api) throw new Error("useRequestDialog se usa dentro de <RequestDialogProvider>");
  return api;
}

// El detalle de un pedido "Necesito de…": qué se pide, a quién, y la conversación sobre él.
export function RequestDialogProvider({ meId, children }: { meId: string; children: React.ReactNode }) {
  const [request, setRequest] = useState<RequestItem | null>(null);
  const api = useMemo<RequestDialogApi>(() => ({ open: setRequest }), []);
  const close = useCallback(() => setRequest(null), []);

  return (
    <RequestDialogContext.Provider value={api}>
      {children}
      <Modal open={request !== null} onClose={close} title="Pedido">
        {request && <RequestEditor key={request.id} request={request} meId={meId} onClose={close} />}
      </Modal>
    </RequestDialogContext.Provider>
  );
}

type Tab = "details" | "comments" | "activity";

const TABS = [
  { id: "details", label: "Detalles" },
  { id: "comments", label: "Comentarios" },
  { id: "activity", label: "Historial" },
] as const;

function RequestEditor({ request, meId, onClose }: { request: RequestItem; meId: string; onClose: () => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("details");
  const [commentsOpened, setCommentsOpened] = useState(false);

  const finish = (message: string) => {
    onClose();
    toast(message);
  };
  const deliver = useFormAction(finish, "Pedido entregado");
  const cancel = useFormAction(finish, "Pedido cancelado");

  const pending = request.status === "pendiente";
  const canDeliver = pending && request.providerId === meId;
  const canCancel = pending && request.requesterId === meId;
  const today = todayISO();

  function select(next: Tab) {
    setTab(next);
    if (next === "comments") setCommentsOpened(true);
  }

  function confirmCancel() {
    if (!window.confirm("¿Cancelar este pedido? La tarea que frenaba queda libre.")) return;
    cancel.run(() => cancelDependency(request.id));
  }

  return (
    <div>
      <Tabs tabs={TABS} value={tab} onChange={select} idPrefix="request" label="Secciones del pedido" />

      <div role="tabpanel" id="request-panel-details" aria-labelledby="request-tab-details" hidden={tab !== "details"}>
        <Badge tone={pending ? "high" : "done"}>{pending ? "Pendiente" : "Entregado"}</Badge>
        <h3 className="mt-3 font-display text-xl font-semibold text-ink">{request.title}</h3>

        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
          <PersonAvatar person={request.requester} size="sm" />
          {request.requester?.fullName ?? "Alguien"}
          <ArrowRight className="size-4 text-muted" aria-label="le pide a" />
          <PersonAvatar person={request.provider} size="sm" />
          {request.provider?.fullName ?? "alguien"}
        </p>

        {request.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-ink">{request.description}</p>
        )}

        <dl className="mt-5 space-y-2 text-sm">
          {request.dueDate && (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted">Para cuándo</dt>
              <dd className="font-medium text-ink">
                {formatDueLabel(request.dueDate, today)} ({formatShortDate(request.dueDate)})
              </dd>
            </div>
          )}
          {request.task && (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted">{pending ? "Frena la tarea" : "Frenaba la tarea"}</dt>
              <dd className="font-medium text-ink">{request.task.title}</dd>
            </div>
          )}
          {request.project && (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted">Proyecto</dt>
              <dd>
                <Link
                  href={`/proyectos/${request.project.id}`}
                  onClick={onClose}
                  className="font-semibold text-bordo underline underline-offset-4"
                >
                  {request.project.name}
                </Link>
              </dd>
            </div>
          )}
          {request.deliveredAt && (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted">Entregado el</dt>
              <dd className="font-medium text-ink">{formatShortDate(dateInAR(request.deliveredAt))}</dd>
            </div>
          )}
        </dl>

        <FormFooterError error={deliver.error ?? cancel.error} />

        {(canDeliver || canCancel) && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
            {canDeliver && (
              <Button onClick={() => deliver.run(() => deliverDependency(request.id))} disabled={deliver.pending}>
                <Check className="size-4" aria-hidden />
                {deliver.pending ? "Guardando…" : "Marcar como entregado"}
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={confirmCancel} disabled={cancel.pending}>
                <X className="size-4" aria-hidden />
                Cancelar pedido
              </Button>
            )}
          </div>
        )}
      </div>

      {commentsOpened && (
        <div role="tabpanel" id="request-panel-comments" aria-labelledby="request-tab-comments" hidden={tab !== "comments"}>
          <EntityComments entityType="dependency" entityId={request.id} />
        </div>
      )}
      {tab === "activity" && (
        <div role="tabpanel" id="request-panel-activity" aria-labelledby="request-tab-activity">
          <EntityActivity entityType="dependency" entityId={request.id} />
        </div>
      )}
    </div>
  );
}
