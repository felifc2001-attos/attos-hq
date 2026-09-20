"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, textareaClass } from "@/components/ui/form-controls";
import { addDays, todayISO } from "@/lib/dates";
import { createTask, deleteTask, getTaskFormOptions, updateTask } from "@/lib/tasks/actions";
import {
  AREAS,
  PRIORITIES,
  STATUSES,
  type Area,
  type Priority,
  type TaskStatus,
} from "@/lib/tasks/constants";
import type { Task, TaskFormOptions, TaskInput } from "@/lib/tasks/types";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/tasks/validate";
import { cn } from "@/lib/utils";
import { EntityActivity } from "@/components/comments/entity-activity";
import { EntityComments } from "@/components/comments/entity-comments";

/** Datos con los que arranca una tarea nueva (por ejemplo, desde un proyecto o al convertir una idea). */
export interface TaskDefaults {
  title?: string;
  description?: string;
  area?: Area | null;
  projectId?: string | null;
  /** Si viene de una idea: al crear la tarea, la idea queda marcada como convertida. */
  ideaId?: string;
}

type DialogState = { kind: "new"; defaults?: TaskDefaults } | { kind: "edit"; task: Task } | null;

interface TaskDialogApi {
  openNew: (defaults?: TaskDefaults) => void;
  openEdit: (task: Task) => void;
}

const TaskDialogContext = createContext<TaskDialogApi | null>(null);

export function useTaskDialog(): TaskDialogApi {
  const api = useContext(TaskDialogContext);
  if (!api) throw new Error("useTaskDialog se usa dentro de <TaskDialogProvider>");
  return api;
}

// Un único diálogo para toda la app: crear ("+", botón "Nueva tarea") y editar (click en una tarea).
export function TaskDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const [options, setOptions] = useState<TaskFormOptions | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Los desplegables (personas, proyectos) se piden cada vez que se abre, así siempre están al día.
  const loadOptions = useCallback(() => {
    setLoadFailed(false);
    getTaskFormOptions().then(setOptions, () => setLoadFailed(true));
  }, []);

  const api = useMemo<TaskDialogApi>(
    () => ({
      openNew: (defaults) => {
        setState({ kind: "new", defaults });
        loadOptions();
      },
      openEdit: (task) => {
        setState({ kind: "edit", task });
        loadOptions();
      },
    }),
    [loadOptions],
  );

  const close = useCallback(() => setState(null), []);

  // El <dialog> nativo se encarga del foco, de la tecla Esc y de bloquear lo de atrás.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (state && !dialog.open) dialog.showModal();
    if (!state && dialog.open) dialog.close();
  }, [state]);

  return (
    <TaskDialogContext.Provider value={api}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="task-dialog-title"
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close(); // click en el fondo oscuro
        }}
        className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-ink/30 backdrop:backdrop-blur-[2px]"
      >
        {state && (
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 id="task-dialog-title" className="font-display text-2xl font-semibold">
                {state.kind === "edit"
                  ? "Editar tarea"
                  : state.defaults?.ideaId
                    ? "Convertir idea en tarea"
                    : "Nueva tarea"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="-mr-2 -mt-1 inline-flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-beige hover:text-ink"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {options ? (
              state.kind === "edit" ? (
                <TaskEditor task={state.task} options={options} onDone={close} />
              ) : (
                <TaskForm editing={null} defaults={state.defaults} options={options} onDone={close} />
              )
            ) : loadFailed ? (
              <div className="space-y-4 py-4 text-center">
                <p className="text-sm text-muted">No se pudo cargar el formulario.</p>
                <Button variant="outline" size="sm" onClick={loadOptions}>
                  Reintentar
                </Button>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted">Cargando…</p>
            )}
          </div>
        )}
      </dialog>
    </TaskDialogContext.Provider>
  );
}

type Tab = "details" | "comments" | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Detalles" },
  { id: "comments", label: "Comentarios" },
  { id: "activity", label: "Historial" },
];

// Editar una tarea existente: el formulario, sus comentarios y su historial en pestañas.
function TaskEditor({ task, options, onDone }: { task: Task; options: TaskFormOptions; onDone: () => void }) {
  const [tab, setTab] = useState<Tab>("details");
  const [commentsOpened, setCommentsOpened] = useState(false);

  function select(next: Tab) {
    setTab(next);
    if (next === "comments") setCommentsOpened(true);
  }

  return (
    <div>
      <div role="tablist" aria-label="Secciones de la tarea" className="-mt-2 mb-5 flex gap-1 border-b border-line">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`task-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`task-panel-${id}`}
            onClick={() => select(id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
              tab === id ? "border-bordo text-bordo" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* El formulario y los comentarios quedan montados al cambiar de pestaña para no perder lo escrito. */}
      <div role="tabpanel" id="task-panel-details" aria-labelledby="task-tab-details" hidden={tab !== "details"}>
        <TaskForm editing={task} options={options} onDone={onDone} />
      </div>
      {commentsOpened && (
        <div role="tabpanel" id="task-panel-comments" aria-labelledby="task-tab-comments" hidden={tab !== "comments"}>
          <EntityComments entityType="task" entityId={task.id} />
        </div>
      )}
      {tab === "activity" && (
        <div role="tabpanel" id="task-panel-activity" aria-labelledby="task-tab-activity">
          <EntityActivity entityType="task" entityId={task.id} />
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

interface TaskFormProps {
  editing: Task | null;
  /** Datos de partida al crear (no se usan al editar). */
  defaults?: TaskDefaults;
  options: TaskFormOptions;
  onDone: () => void;
}

function TaskForm({ editing, defaults, options, onDone }: TaskFormProps) {
  const [title, setTitle] = useState(editing?.title ?? defaults?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? defaults?.description ?? "");
  const [assigneeId, setAssigneeId] = useState(editing ? (editing.assigneeId ?? "") : options.meId);
  const [projectId, setProjectId] = useState(editing?.projectId ?? defaults?.projectId ?? "");
  const [area, setArea] = useState<Area | "">(
    editing ? (editing.area ?? "") : (defaults?.area ?? options.defaultArea ?? ""),
  );
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? "");
  const [priority, setPriority] = useState<Priority>(editing?.priority ?? "media");
  const [status, setStatus] = useState<TaskStatus>(editing?.status ?? "por_hacer");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Si la tarea tiene a alguien (o un proyecto) que ya no figura en las listas, se sigue mostrando.
  const people = options.people.some((person) => person.id === editing?.assigneeId) || !editing?.assignee
    ? options.people
    : [...options.people, { ...editing.assignee, defaultArea: null }];
  const projects = options.projects.some((project) => project.id === editing?.projectId) || !editing?.project
    ? options.projects
    : [...options.projects, editing.project];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const input: TaskInput = {
      title,
      description,
      assigneeId: assigneeId || null,
      area: area || null,
      projectId: projectId || null,
      dueDate: dueDate || null,
      priority,
      status,
    };

    startTransition(async () => {
      const result = editing
        ? await updateTask(editing.id, input)
        : await createTask(input, defaults?.ideaId ? { fromIdeaId: defaults.ideaId } : undefined);
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  function remove() {
    if (!editing) return;
    if (!window.confirm("¿Eliminar esta tarea? Esta acción no se puede deshacer.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteTask(editing.id);
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Título">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={TITLE_MAX}
          autoFocus
          placeholder="¿Qué hay que hacer?"
          className={inputClass}
        />
      </Field>

      <Field label="Descripción (opcional)">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={DESCRIPTION_MAX}
          rows={3}
          placeholder="Detalles, contexto, links…"
          className={textareaClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Asignada a">
          <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} className={inputClass}>
            <option value="">Sin asignar</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
                {person.id === options.meId ? " (yo)" : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Proyecto">
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={inputClass}>
            <option value="">Sin proyecto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
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

        <Field label="Prioridad">
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className={inputClass}>
            {PRIORITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Estado">
          <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)} className={inputClass}>
            {STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <Field label="Fecha límite">
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="mt-1.5 flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setDueDate(todayISO())}>
              Hoy
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDueDate(addDays(todayISO(), 1))}>
              Mañana
            </Button>
            {dueDate && (
              <Button variant="ghost" size="sm" onClick={() => setDueDate("")}>
                Quitar
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {editing ? (
          <Button variant="ghost" size="sm" onClick={remove} disabled={pending} className="text-prio-urgent hover:text-prio-urgent">
            <Trash2 className="size-4" aria-hidden />
            Eliminar
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDone} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending || !title.trim()}>
            {pending ? "Guardando…" : editing ? "Guardar cambios" : "Crear tarea"}
          </Button>
        </div>
      </div>
    </form>
  );
}
