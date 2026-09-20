"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { inputClass, textareaClass } from "@/components/ui/form-controls";
import { createIssue } from "@/lib/quick-create/actions";
import { ISSUE_CATEGORIES, type IssueCategory } from "@/lib/quick-create/constants";
import { PRIORITIES, type Priority } from "@/lib/tasks/constants";
import { FormFooter, useFormAction, type FormProps } from "./shared";

export function IssueForm({ options, onDone, onCancel }: FormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IssueCategory>("bug");
  const [priority, setPriority] = useState<Priority>("media");
  const [assigneeId, setAssigneeId] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const { error, pending, run } = useFormAction(
    onDone,
    assigneeId ? "Problema reportado" : "Problema reportado: le llega a Sistemas",
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(() =>
          createIssue({
            title,
            category,
            priority,
            assigneeId: assigneeId || null,
            description,
            steps: category === "bug" ? steps : "",
          }),
        );
      }}
      className="space-y-4"
    >
      <Field label="¿Qué pasó?">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
          autoFocus
          placeholder="Ej: El total del pedido no se actualiza al cambiar cantidades"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <select value={category} onChange={(event) => setCategory(event.target.value as IssueCategory)} className={inputClass}>
            {ISSUE_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Prioridad">
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className={inputClass}>
            {PRIORITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Asignar a" hint="Si no elegís a nadie, le llega a Sistemas para que lo reparta.">
        <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} className={inputClass}>
          <option value="">Bandeja de Sistemas</option>
          {options.people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.fullName}
              {person.id === options.meId ? " (yo)" : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Detalle (opcional)">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={5000}
          rows={3}
          placeholder="Qué esperabas que pasara y qué pasó en cambio."
          className={textareaClass}
        />
      </Field>

      {category === "bug" && (
        <Field label="Pasos para reproducirlo (opcional)">
          <textarea
            value={steps}
            onChange={(event) => setSteps(event.target.value)}
            maxLength={5000}
            rows={3}
            placeholder={"1. Abrir un pedido.\n2. Cambiar la cantidad de un producto.\n3. …"}
            className={textareaClass}
          />
        </Field>
      )}

      <FormFooter error={error} pending={pending} submitLabel="Reportar problema" canSubmit={!!title.trim()} onCancel={onCancel} />
    </form>
  );
}
