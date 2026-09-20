"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { inputClass, textareaClass } from "@/components/ui/form-controls";
import { createIdea } from "@/lib/quick-create/actions";
import { AREAS, type Area } from "@/lib/tasks/constants";
import { FormFooter, useFormAction, type FormProps } from "./shared";

export function IdeaForm({ options, onDone, onCancel }: FormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<Area | "">(options.defaultArea ?? "");
  const { error, pending, run } = useFormAction(onDone, "Idea guardada");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(() => createIdea({ title, description, area: area || null }));
      }}
      className="space-y-4"
    >
      <Field label="¿Cuál es la idea?">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
          autoFocus
          placeholder="Ej: Reel mostrando cuánto cuesta llenar una heladera"
          className={inputClass}
        />
      </Field>

      <Field label="Contanos más (opcional)">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="Para qué sirve, cómo se haría, qué ayudaría a decidir…"
          className={textareaClass}
        />
      </Field>

      <Field label="Área">
        <select value={area} onChange={(event) => setArea(event.target.value as Area | "")} className={inputClass}>
          <option value="">Sin área</option>
          {AREAS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <FormFooter error={error} pending={pending} submitLabel="Guardar idea" canSubmit={!!title.trim()} onCancel={onCancel} />
    </form>
  );
}
