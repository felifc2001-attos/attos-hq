"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { inputClass, textareaClass } from "@/components/ui/form-controls";
import { createDependency } from "@/lib/quick-create/actions";
import { FormFooter, useFormAction, type FormProps } from "./shared";

// "Necesito de…": le pido algo a otra persona para poder avanzar.
export function DependencyForm({ options, onDone, onCancel }: FormProps) {
  const others = options.people.filter((person) => person.id !== options.meId);

  const [providerId, setProviderId] = useState(others.length === 1 ? others[0].id : "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskId, setTaskId] = useState("");
  const [projectId, setProjectId] = useState("");
  const { error, pending, run } = useFormAction(onDone, "Pedido enviado");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(() =>
          createDependency({
            providerId,
            title,
            description,
            dueDate: dueDate || null,
            taskId: taskId || null,
            projectId: projectId || null,
          }),
        );
      }}
      className="space-y-4"
    >
      <Field label="¿De quién lo necesitás?">
        <select value={providerId} onChange={(event) => setProviderId(event.target.value)} required className={inputClass}>
          <option value="">Elegí una persona</option>
          {others.map((person) => (
            <option key={person.id} value={person.id}>
              {person.fullName}
            </option>
          ))}
        </select>
      </Field>

      <Field label="¿Qué necesitás?">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
          autoFocus
          placeholder="Ej: Precio final de los productos"
          className={inputClass}
        />
      </Field>

      <Field label="Detalle (opcional)">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={5000}
          rows={3}
          placeholder="Para qué lo necesitás o cómo lo querés recibir."
          className={textareaClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Para cuándo (opcional)">
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} />
        </Field>

        <Field label="Proyecto (opcional)">
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={inputClass}>
            <option value="">Sin proyecto</option>
            {options.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Esto frena una tarea mía (opcional)" hint="Esa tarea aparece como bloqueada hasta que te lo entreguen.">
        <select value={taskId} onChange={(event) => setTaskId(event.target.value)} className={inputClass}>
          <option value="">Ninguna</option>
          {options.myTasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </Field>

      <FormFooter
        error={error}
        pending={pending}
        submitLabel="Enviar pedido"
        canSubmit={!!providerId && !!title.trim()}
        onCancel={onCancel}
      />
    </form>
  );
}
