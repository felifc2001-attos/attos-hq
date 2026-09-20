"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cancelDependency, deliverDependency } from "@/lib/dependencies/actions";

interface RequestActionsProps {
  id: string;
  /** "incoming": me lo piden a mí (lo puedo entregar). "outgoing": lo pedí yo (lo puedo cancelar). */
  direction: "incoming" | "outgoing";
}

export function RequestActions({ id, direction }: RequestActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  function run(action: () => ReturnType<typeof deliverDependency>, message: string) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast(message);
      else setError(result.error);
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {direction === "incoming" ? (
        <Button size="sm" variant="soft" disabled={pending} onClick={() => run(() => deliverDependency(id), "Pedido entregado")}>
          <Check className="size-4" aria-hidden />
          Entregado
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            if (window.confirm("¿Cancelar este pedido? La tarea que frenaba queda libre.")) {
              run(() => cancelDependency(id), "Pedido cancelado");
            }
          }}
        >
          <X className="size-4" aria-hidden />
          Cancelar
        </Button>
      )}
      {error && (
        <p role="alert" className="max-w-40 text-right text-xs text-prio-urgent">
          {error}
        </p>
      )}
    </div>
  );
}
