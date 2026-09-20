"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputClass, textareaClass } from "@/components/ui/form-controls";
import { deleteProject, updateProject } from "@/lib/projects/actions";
import type { EditableProject } from "@/lib/projects/types";
import { createProject } from "@/lib/quick-create/actions";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/quick-create/constants";
import { FormFooter, useFormAction, type FormProps } from "./shared";

/** Datos con los que arranca un proyecto nuevo (por ejemplo, al convertir una idea). */
export interface ProjectDefaults {
  name?: string;
  description?: string;
  /** Si viene de una idea: al crear el proyecto, la idea queda marcada como convertida. */
  ideaId?: string;
}

interface ProjectFormProps extends FormProps {
  defaults?: ProjectDefaults;
  /** Si viene, el formulario edita ese proyecto en vez de crear uno. */
  editing?: EditableProject;
}

export function ProjectForm({ options, onDone, onCancel, defaults, editing }: ProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState(editing?.name ?? defaults?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? defaults?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(editing?.status ?? "planificando");
  const [ownerId, setOwnerId] = useState(editing ? (editing.ownerId ?? "") : options.meId);
  const [startDate, setStartDate] = useState(editing?.startDate ?? "");
  const [targetDate, setTargetDate] = useState(editing?.targetDate ?? "");
  // Al crear participa todo el equipo; se puede destildar a quien no.
  const [memberIds, setMemberIds] = useState<string[]>(
    () => editing?.memberIds ?? options.people.map((person) => person.id),
  );
  const { error, pending, run } = useFormAction(onDone, editing ? "Proyecto actualizado" : "Proyecto creado");
  const removal = useFormAction(onDone, "Proyecto eliminado");

  function toggleMember(id: string, checked: boolean) {
    setMemberIds((current) => (checked ? [...current, id] : current.filter((memberId) => memberId !== id)));
  }

  function remove() {
    if (!editing) return;
    if (
      !window.confirm(
        "¿Eliminar este proyecto? Sus tareas no se borran: quedan sin proyecto. Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }
    removal.run(async () => {
      const result = await deleteProject(editing.id);
      // Estando en la página del proyecto, ya no existe: se vuelve a la lista.
      if (result.ok) router.push("/proyectos");
      return result;
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const input = {
          name,
          description,
          status,
          ownerId: ownerId || null,
          startDate: startDate || null,
          targetDate: targetDate || null,
          memberIds,
        };
        run(() =>
          editing
            ? updateProject(editing.id, input)
            : createProject(input, defaults?.ideaId ? { fromIdeaId: defaults.ideaId } : undefined),
        );
      }}
      className="space-y-4"
    >
      <Field label="Nombre del proyecto">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={120}
          autoFocus
          placeholder="Ej: Campaña Día del Padre"
          className={inputClass}
        />
      </Field>

      <Field label="Descripción (opcional)">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={5000}
          rows={3}
          placeholder="Qué se quiere lograr."
          className={textareaClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Responsable">
          <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className={inputClass}>
            {editing && !editing.ownerId && <option value="">Sin responsable</option>}
            {options.people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
                {person.id === options.meId ? " (yo)" : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Estado">
          <select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)} className={inputClass}>
            {PROJECT_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Inicio (opcional)">
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputClass} />
        </Field>

        <Field label="Fecha objetivo (opcional)">
          <input type="date" value={targetDate} min={startDate || undefined} onChange={(event) => setTargetDate(event.target.value)} className={inputClass} />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Quiénes participan</legend>
        <div className="flex flex-wrap gap-2">
          {options.people.map((person) => (
            <label
              key={person.id}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink has-[:checked]:border-bordo has-[:checked]:bg-bordo-soft"
            >
              <input
                type="checkbox"
                checked={memberIds.includes(person.id)}
                onChange={(event) => toggleMember(person.id, event.target.checked)}
                className="size-4 accent-bordo"
              />
              {person.fullName}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {editing ? "El responsable siempre forma parte del proyecto." : "Vos y el responsable siempre forman parte del proyecto."}
        </p>
      </fieldset>

      {editing && removal.error && (
        <p role="alert" className="rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
          {removal.error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {editing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={pending || removal.pending}
            className="text-prio-urgent hover:text-prio-urgent"
          >
            <Trash2 className="size-4" aria-hidden />
            Eliminar proyecto
          </Button>
        ) : (
          <span />
        )}
      </div>

      <FormFooter
        error={error}
        pending={pending}
        submitLabel={editing ? "Guardar cambios" : "Crear proyecto"}
        canSubmit={!!name.trim()}
        onCancel={onCancel}
      />
    </form>
  );
}
