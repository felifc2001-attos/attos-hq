"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { inputClass } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { FormFooter, useFormAction } from "@/components/quick-create/shared";
import { updateProfile } from "@/lib/profile/actions";
import type { ProfileData } from "@/lib/profile/types";
import { AREA_TEXT_MAX, NAME_MAX, PROFILE_COLORS } from "@/lib/profile/validate";
import { AREAS, type Area } from "@/lib/tasks/constants";

// Editar tu nombre, tu área y tu color. El color te identifica en avatares, tareas y calendario.
export function ProfileForm({ profile }: { profile: ProfileData }) {
  const toast = useToast();
  const [fullName, setFullName] = useState(profile.fullName);
  const [area, setArea] = useState(profile.area);
  const [defaultArea, setDefaultArea] = useState<Area | "">(profile.defaultArea ?? "");
  const [color, setColor] = useState(profile.color);
  const { error, pending, run } = useFormAction(toast, "Perfil actualizado");

  // Si tu color actual no está en la paleta (se cargó a mano), igual se muestra para poder volver a él.
  const palette = PROFILE_COLORS.some((option) => option.value === profile.color)
    ? PROFILE_COLORS
    : [...PROFILE_COLORS, { value: profile.color, label: "Tu color actual" }];

  const changed =
    fullName.trim() !== profile.fullName ||
    area.trim() !== profile.area ||
    (defaultArea || null) !== profile.defaultArea ||
    color !== profile.color;

  return (
    <Card>
      <CardTitle>Tus datos</CardTitle>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          run(() => updateProfile({ fullName, area, defaultArea: defaultArea || null, color }));
        }}
        className="mt-4 space-y-4"
      >
        <div className="flex items-center gap-4">
          <Avatar member={{ name: fullName, initials: fullName.trim().charAt(0).toUpperCase() || "?", color }} size="lg" />
          <p className="text-sm text-muted">Así te ven los demás.</p>
        </div>

        <Field label="Nombre">
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={NAME_MAX} className={inputClass} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tu rol en el equipo (opcional)" hint="Lo ven los demás bajo tu nombre.">
            <input
              value={area}
              onChange={(event) => setArea(event.target.value)}
              maxLength={AREA_TEXT_MAX}
              placeholder="Ej: Comercial & Operaciones"
              className={inputClass}
            />
          </Field>

          <Field label="Área de trabajo habitual" hint="Es la que se sugiere al crear tareas y eventos.">
            <select value={defaultArea} onChange={(event) => setDefaultArea(event.target.value as Area | "")} className={inputClass}>
              <option value="">Ninguna en particular</option>
              {AREAS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Tu color</legend>
          <div className="flex flex-wrap gap-2.5">
            {palette.map((option) => (
              <label key={option.value} className="cursor-pointer" title={option.label}>
                <input
                  type="radio"
                  name="color"
                  value={option.value}
                  checked={color === option.value}
                  onChange={() => setColor(option.value)}
                  className="peer sr-only"
                />
                <span
                  style={{ backgroundColor: option.value }}
                  className="block size-9 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-surface transition peer-checked:ring-ink peer-focus-visible:ring-bordo"
                />
                <span className="sr-only">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <FormFooter
          error={error}
          pending={pending}
          submitLabel="Guardar cambios"
          canSubmit={!!fullName.trim() && changed}
          onCancel={() => {
            setFullName(profile.fullName);
            setArea(profile.area);
            setDefaultArea(profile.defaultArea ?? "");
            setColor(profile.color);
          }}
        />
      </form>
    </Card>
  );
}
