"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Check, MessageSquareWarning, Trash2 } from "lucide-react";
import { EntityActivity } from "@/components/comments/entity-activity";
import { EntityComments } from "@/components/comments/entity-comments";
import { FormFooter, FormFooterError, useFormAction } from "@/components/quick-create/shared";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputClass, textareaClass } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  approveContent,
  createContent,
  deleteContent,
  requestContentChanges,
  updateContent,
} from "@/lib/content/actions";
import {
  CONTENT_FORMATS,
  CONTENT_STATUSES,
  type ContentFormat,
  type ContentStatus,
} from "@/lib/content/constants";
import { canReview } from "@/lib/content/rules";
import type { ContentItem } from "@/lib/content/types";
import { dateInAR, formatRelativeTime, timeInAR } from "@/lib/dates";
import { getTaskFormOptions } from "@/lib/tasks/actions";
import type { TaskFormOptions } from "@/lib/tasks/types";

/** Datos con los que arranca una publicación nueva (por ejemplo, la columna donde se la crea). */
export interface ContentDefaults {
  status?: ContentStatus;
  /** Día de publicación, YYYY-MM-DD. */
  publishDate?: string;
}

type DialogState = { kind: "new"; defaults?: ContentDefaults } | { kind: "edit"; item: ContentItem } | null;

interface ContentDialogApi {
  openNew: (defaults?: ContentDefaults) => void;
  open: (item: ContentItem) => void;
}

const ContentDialogContext = createContext<ContentDialogApi | null>(null);

export function useContentDialog(): ContentDialogApi {
  const api = useContext(ContentDialogContext);
  if (!api) throw new Error("useContentDialog se usa dentro de <ContentDialogProvider>");
  return api;
}

// Un único diálogo para todo el contenido: crear (botón "Nuevo contenido", "+") y abrir una publicación (tablero, calendario, notificaciones).
export function ContentDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const [options, setOptions] = useState<TaskFormOptions | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Personas y proyectos se piden cada vez que se abre, así siempre están al día.
  const loadOptions = useCallback(() => {
    setLoadFailed(false);
    getTaskFormOptions().then(setOptions, () => setLoadFailed(true));
  }, []);

  const api = useMemo<ContentDialogApi>(
    () => ({
      openNew: (defaults) => {
        setState({ kind: "new", defaults });
        loadOptions();
      },
      open: (item) => {
        setState({ kind: "edit", item });
        loadOptions();
      },
    }),
    [loadOptions],
  );

  const close = useCallback(() => setState(null), []);

  return (
    <ContentDialogContext.Provider value={api}>
      {children}
      <Modal open={state !== null} onClose={close} title={state?.kind === "edit" ? "Publicación" : "Nuevo contenido"}>
        {state &&
          (options ? (
            <ContentEditor key={state.kind === "edit" ? state.item.id : "new"} state={state} options={options} onClose={close} />
          ) : loadFailed ? (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-muted">No se pudo cargar el formulario.</p>
              <Button variant="outline" size="sm" onClick={loadOptions}>
                Reintentar
              </Button>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">Cargando…</p>
          ))}
      </Modal>
    </ContentDialogContext.Provider>
  );
}

type Tab = "details" | "comments" | "activity";

const TABS = [
  { id: "details", label: "Detalles" },
  { id: "comments", label: "Comentarios" },
  { id: "activity", label: "Historial" },
] as const;

function ContentEditor({
  state,
  options,
  onClose,
}: {
  state: NonNullable<DialogState>;
  options: TaskFormOptions;
  onClose: () => void;
}) {
  const toast = useToast();
  const item = state.kind === "edit" ? state.item : null;
  const [tab, setTab] = useState<Tab>("details");
  const [commentsOpened, setCommentsOpened] = useState(false);

  const finish = useCallback(
    (message: string) => {
      onClose();
      toast(message);
    },
    [onClose, toast],
  );

  function select(next: Tab) {
    setTab(next);
    if (next === "comments") setCommentsOpened(true);
  }

  const details = (
    <>
      {item && <ReviewSection item={item} onDone={finish} />}
      <ContentForm
        editing={item}
        defaults={state.kind === "new" ? state.defaults : undefined}
        options={options}
        onDone={finish}
        onCancel={onClose}
      />
    </>
  );

  if (!item) return details;

  return (
    <div>
      <Tabs tabs={TABS} value={tab} onChange={select} idPrefix="content" label="Secciones de la publicación" />

      {/* El formulario y los comentarios quedan montados al cambiar de pestaña para no perder lo escrito. */}
      <div role="tabpanel" id="content-panel-details" aria-labelledby="content-tab-details" hidden={tab !== "details"}>
        {details}
      </div>
      {commentsOpened && (
        <div role="tabpanel" id="content-panel-comments" aria-labelledby="content-tab-comments" hidden={tab !== "comments"}>
          <EntityComments entityType="content_item" entityId={item.id} />
        </div>
      )}
      {tab === "activity" && (
        <div role="tabpanel" id="content-panel-activity" aria-labelledby="content-tab-activity">
          <EntityActivity entityType="content_item" entityId={item.id} />
        </div>
      )}
    </div>
  );
}

// Lo que se sabe de la revisión: los botones para aprobar mientras espera, o cómo salió.
function ReviewSection({ item, onDone }: { item: ContentItem; onDone: (message: string) => void }) {
  const approve = useFormAction(onDone, item.publishAt ? "Aprobado y programado" : "Contenido aprobado");
  const changes = useFormAction(onDone, "Cambios pedidos");
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const busy = approve.pending || changes.pending;

  if (canReview(item.status)) {
    return (
      <section className="mb-5 rounded-2xl bg-st-review/10 p-4">
        <h3 className="text-sm font-semibold text-ink">Esperando aprobación</h3>
        <p className="mt-0.5 text-sm text-muted">
          {item.publishAt
            ? "Si lo aprobás, queda programado para su fecha."
            : "Si lo aprobás sin fecha de publicación, se queda acá hasta que le pongan una."}
        </p>

        {asking ? (
          <div className="mt-3 space-y-3">
            <Field label="¿Qué hay que cambiar? (opcional)" hint="Queda como comentario y se le avisa a quien lo hace.">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={1000}
                rows={3}
                autoFocus
                className={textareaClass}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button variant="warning" onClick={() => changes.run(() => requestContentChanges(item.id, note))} disabled={busy}>
                <MessageSquareWarning className="size-4" aria-hidden />
                {changes.pending ? "Enviando…" : "Enviar pedido de cambios"}
              </Button>
              <Button variant="ghost" onClick={() => setAsking(false)} disabled={busy}>
                Volver
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => approve.run(() => approveContent(item.id))} disabled={busy}>
              <Check className="size-4" aria-hidden />
              {approve.pending ? "Aprobando…" : "Aprobar"}
            </Button>
            <Button variant="outline" onClick={() => setAsking(true)} disabled={busy}>
              <MessageSquareWarning className="size-4" aria-hidden />
              Pedir cambios
            </Button>
          </div>
        )}
        <FormFooterError error={approve.error ?? changes.error} />
      </section>
    );
  }

  if (item.reviewStatus === "pendiente" || !item.reviewer) return null;
  const approved = item.reviewStatus === "aprobado";
  return (
    <p className="mb-5 rounded-xl bg-beige-deep/60 px-4 py-3 text-sm text-ink">
      {approved ? "Aprobado" : "Cambios pedidos"} por <strong className="font-semibold">{item.reviewer.fullName}</strong>
      {item.reviewedAt && ` · ${formatRelativeTime(item.reviewedAt)}`}
    </p>
  );
}

interface ContentFormProps {
  editing: ContentItem | null;
  defaults?: ContentDefaults;
  options: TaskFormOptions;
  onDone: (message: string) => void;
  onCancel: () => void;
}

function ContentForm({ editing, defaults, options, onDone, onCancel }: ContentFormProps) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [format, setFormat] = useState<ContentFormat>(editing?.format ?? "post");
  const [status, setStatus] = useState<ContentStatus>(editing?.status ?? defaults?.status ?? "ideas");
  const [assigneeId, setAssigneeId] = useState(editing ? (editing.assigneeId ?? "") : options.meId);
  const [projectId, setProjectId] = useState(editing?.projectId ?? "");
  const [publishDate, setPublishDate] = useState(editing?.publishAt ? dateInAR(editing.publishAt) : (defaults?.publishDate ?? ""));
  const [publishTime, setPublishTime] = useState(editing?.publishAt ? timeInAR(editing.publishAt) : "");
  const [copy, setCopy] = useState(editing?.copy ?? "");
  const [linksText, setLinksText] = useState(editing?.links.join("\n") ?? "");
  const { error, pending, run } = useFormAction(onDone, editing ? "Contenido actualizado" : "Contenido creado");
  const removal = useFormAction(onDone, "Contenido eliminado");

  // Si la publicación tiene a alguien o un proyecto que ya no figura en las listas, se sigue mostrando.
  const people =
    !editing?.assignee || options.people.some((person) => person.id === editing.assigneeId)
      ? options.people
      : [...options.people, { ...editing.assignee, defaultArea: null }];
  const projects =
    !editing?.project || options.projects.some((project) => project.id === editing.projectId)
      ? options.projects
      : [...options.projects, editing.project];

  function remove() {
    if (!editing) return;
    if (!window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    removal.run(() => deleteContent(editing.id));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const input = {
          title,
          format,
          status,
          assigneeId: assigneeId || null,
          projectId: projectId || null,
          publishDate: publishDate || null,
          publishTime: publishDate ? publishTime || null : null,
          copy,
          links: linksText.split("\n"),
        };
        run(() => (editing ? updateContent(editing.id, input) : createContent(input)));
      }}
      className="space-y-4"
    >
      <Field label="Título">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
          autoFocus={!editing}
          placeholder="Ej: Reel del pedido de la semana"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Formato">
          <select value={format} onChange={(event) => setFormat(event.target.value as ContentFormat)} className={inputClass}>
            {CONTENT_FORMATS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Etapa">
          <select value={status} onChange={(event) => setStatus(event.target.value as ContentStatus)} className={inputClass}>
            {CONTENT_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Responsable">
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

        <Field label="Proyecto (opcional)">
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={inputClass}>
            <option value="">Sin proyecto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted">
        Para pasar a “Programado” o “Publicado” tiene que estar aprobado: primero se lleva a “Para aprobar”.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Día de publicación (opcional)">
          <input type="date" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Hora" hint={publishDate ? "Si la dejás vacía, se toma 12:00." : undefined}>
          <input
            type="time"
            value={publishTime}
            onChange={(event) => setPublishTime(event.target.value)}
            disabled={!publishDate}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Texto de la publicación (opcional)">
        <textarea
          value={copy}
          onChange={(event) => setCopy(event.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="El copy tal como va a salir."
          className={textareaClass}
        />
      </Field>

      <Field label="Enlaces (opcional)" hint="Uno por línea: moodboard, carpeta de Drive, referencias…">
        <textarea
          value={linksText}
          onChange={(event) => setLinksText(event.target.value)}
          rows={3}
          placeholder="https://…"
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
            Eliminar publicación
          </Button>
          <FormFooterError error={removal.error} />
        </div>
      )}

      <FormFooter
        error={error}
        pending={pending}
        submitLabel={editing ? "Guardar cambios" : "Crear contenido"}
        canSubmit={!!title.trim()}
        onCancel={onCancel}
      />
    </form>
  );
}
