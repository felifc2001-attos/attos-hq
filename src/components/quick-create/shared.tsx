"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { CreateOptions } from "@/lib/quick-create/types";
import type { ActionResult } from "@/lib/tasks/types";

/** Lo que recibe cada formulario de creación rápida. */
export interface FormProps {
  options: CreateOptions;
  /** Se llama al guardar bien, con el mensaje que se muestra como aviso. */
  onDone: (message: string) => void;
  onCancel: () => void;
}

/** Envía el formulario a una acción del servidor y lleva la cuenta de "guardando…" y del error. */
export function useFormAction(onDone: (message: string) => void, successMessage: string) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) onDone(successMessage);
      else setError(result.error);
    });
  }

  return { error, pending, run };
}

/** El mensaje de error de un formulario o acción (no dibuja nada si no hay error). */
export function FormFooterError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-4 rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
      {error}
    </p>
  );
}

interface FormFooterProps {
  error: string | null;
  pending: boolean;
  submitLabel: string;
  canSubmit: boolean;
  onCancel: () => void;
}

export function FormFooter({ error, pending, submitLabel, canSubmit, onCancel }: FormFooterProps) {
  return (
    <>
      {error && (
        <p role="alert" className="rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !canSubmit}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </>
  );
}
