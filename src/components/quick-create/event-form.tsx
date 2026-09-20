"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputClass, textareaClass } from "@/components/ui/form-controls";
import { deleteEvent, updateEvent } from "@/lib/calendar/actions";
import type { EditableEvent } from "@/lib/calendar/types";
import { todayISO } from "@/lib/dates";
import { createEvent } from "@/lib/quick-create/actions";
import {
  EVENT_CATEGORIES,
  EVENT_KINDS,
  type EventCategory,
  type EventKind,
} from "@/lib/quick-create/constants";
import { FormFooter, FormFooterError, useFormAction, type FormProps } from "./shared";

/** Datos con los que arranca un evento nuevo (por ejemplo, al crearlo desde un día del calendario). */
export interface EventDefaults {
  /** Día, YYYY-MM-DD. */
  date?: string;
}

interface EventFormProps extends FormProps {
  defaults?: EventDefaults;
  /** Si viene, el formulario edita ese evento en vez de crear uno. */
  editing?: EditableEvent;
}

// Las áreas de trabajo coinciden con las categorías del calendario (menos "reuniones").
const isEventCategory = (value: string | null): value is EventCategory =>
  EVENT_CATEGORIES.some((category) => category.value === value);

export function EventForm({ options, onDone, onCancel, defaults, editing }: EventFormProps) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [category, setCategory] = useState<EventCategory>(
    editing?.category ?? (isEventCategory(options.defaultArea) ? options.defaultArea : "reuniones"),
  );
  const [kind, setKind] = useState<EventKind>(editing?.kind ?? "reunion");
  const [date, setDate] = useState(() => editing?.date ?? defaults?.date ?? todayISO());
  const [allDay, setAllDay] = useState(editing?.allDay ?? false);
  const [startTime, setStartTime] = useState(editing?.startTime ?? "10:00");
  const [endTime, setEndTime] = useState(editing?.endTime ?? "");
  const [endDate, setEndDate] = useState(editing?.endDate ?? "");
  const [projectId, setProjectId] = useState(editing?.projectId ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const { error, pending, run } = useFormAction(onDone, editing ? "Evento actualizado" : "Evento creado");
  const removal = useFormAction(onDone, "Evento eliminado");

  // Si el evento está en un proyecto que ya no figura en la lista (por ejemplo, uno finalizado), se sigue mostrando.
  const knownProject = !editing?.projectId || options.projects.some((project) => project.id === editing.projectId);

  function remove() {
    if (!editing) return;
    if (!window.confirm("¿Eliminar este evento? Esta acción no se puede deshacer.")) return;
    removal.run(() => deleteEvent(editing.id));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const input = {
          title,
          category,
          kind,
          date,
          allDay,
          startTime,
          endTime: allDay ? null : endTime || null,
          endDate: allDay ? endDate || null : null,
          projectId: projectId || null,
          description,
        };
        run(() => (editing ? updateEvent(editing.id, input) : createEvent(input)));
      }}
      className="space-y-4"
    >
      <Field label="Título">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
          autoFocus
          placeholder="Ej: Reunión con proveedor de cerveza"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoría">
          <select value={category} onChange={(event) => setCategory(event.target.value as EventCategory)} className={inputClass}>
            {EVENT_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tipo">
          <select value={kind} onChange={(event) => setKind(event.target.value as EventKind)} className={inputClass}>
            {EVENT_KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(event) => setAllDay(event.target.checked)}
          className="size-4 accent-bordo"
        />
        Dura todo el día
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={allDay ? "Desde el día" : "Día"}>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required className={inputClass} />
        </Field>

        {allDay ? (
          <Field label="Hasta el día (opcional)" hint="Para eventos de varios días.">
            <input type="date" value={endDate} min={date} onChange={(event) => setEndDate(event.target.value)} className={inputClass} />
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde">
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required className={inputClass} />
            </Field>
            <Field label="Hasta (opcional)">
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={inputClass} />
            </Field>
          </div>
        )}
      </div>

      <Field label="Proyecto (opcional)">
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={inputClass}>
          <option value="">Sin proyecto</option>
          {!knownProject && editing?.projectId && <option value={editing.projectId}>Proyecto actual</option>}
          {options.projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Descripción (opcional)">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={5000}
          rows={3}
          className={textareaClass}
        />
      </Field>

      {editing && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={pending || removal.pending}
            className="text-prio-urgent hover:text-prio-urgent"
          >
            <Trash2 className="size-4" aria-hidden />
            Eliminar evento
          </Button>
          <FormFooterError error={removal.error} />
        </div>
      )}

      <FormFooter
        error={error}
        pending={pending}
        submitLabel={editing ? "Guardar cambios" : "Crear evento"}
        canSubmit={!!title.trim() && !!date}
        onCancel={onCancel}
      />
    </form>
  );
}
