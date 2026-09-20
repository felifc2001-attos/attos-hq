"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputClass } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { FormFooterError, useFormAction } from "@/components/quick-create/shared";
import { changePassword } from "@/lib/profile/actions";
import { PASSWORD_MIN } from "@/lib/profile/validate";

/** Cambiar tu contraseña. La sesión sigue abierta en este dispositivo. */
export function PasswordForm() {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const { error, pending, run } = useFormAction((message) => {
    setPassword("");
    setConfirmation("");
    toast(message);
  }, "Contraseña actualizada");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(() => changePassword(password, confirmation));
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contraseña nueva" hint={`Al menos ${PASSWORD_MIN} caracteres.`}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            className={inputClass}
          />
        </Field>
        <Field label="Repetila">
          <input
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
            className={inputClass}
          />
        </Field>
      </div>

      <FormFooterError error={error} />

      <div>
        <Button type="submit" disabled={pending || !password || !confirmation}>
          {pending ? "Guardando…" : "Cambiar contraseña"}
        </Button>
      </div>
    </form>
  );
}
