"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form-controls";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@email.com"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
