"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FormFooterError, useFormAction } from "@/components/quick-create/shared";
import { NOTIFICATION_TYPES, type NotificationTypeValue } from "@/lib/notifications/preferences";
import type { NotificationPreferences as Preferences } from "@/lib/profile/types";
import { updateNotificationPreferences } from "@/lib/profile/actions";

/** Elegir qué avisos querés recibir. Los que desactivás dejan de crearse (los que ya te llegaron no se borran). */
export function NotificationPreferences({ preferences }: { preferences: Preferences }) {
  const toast = useToast();
  const [muted, setMuted] = useState<NotificationTypeValue[]>(preferences.muted);
  const { error, pending, run } = useFormAction(toast, "Preferencias guardadas");

  const changed = NOTIFICATION_TYPES.some((type) => muted.includes(type.value) !== preferences.muted.includes(type.value));

  function toggle(type: NotificationTypeValue, receive: boolean) {
    setMuted((current) => (receive ? current.filter((value) => value !== type) : [...current, type]));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(() => updateNotificationPreferences(muted));
      }}
    >
      {!preferences.available && (
        <p role="status" className="mb-4 rounded-xl bg-prio-high/10 px-4 py-3 text-sm text-prio-high">
          Todavía no se puede guardar: falta ejecutar el archivo de la Etapa 9 en Supabase.
        </p>
      )}

      <ul className="divide-y divide-line/70">
        {NOTIFICATION_TYPES.map((type) => {
          const receive = !muted.includes(type.value);
          return (
            <li key={type.value}>
              <label className="flex cursor-pointer items-start gap-3 py-3">
                <input
                  type="checkbox"
                  checked={receive}
                  onChange={(event) => toggle(type.value, event.target.checked)}
                  disabled={!preferences.available}
                  className="mt-1 size-4 shrink-0 accent-bordo"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{type.label}</span>
                  <span className="block text-sm text-muted">{type.description}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <FormFooterError error={error} />

      <div className="mt-4">
        <Button type="submit" disabled={pending || !changed || !preferences.available}>
          {pending ? "Guardando…" : "Guardar preferencias"}
        </Button>
      </div>
    </form>
  );
}
