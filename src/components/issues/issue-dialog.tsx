"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { HandHelping, Trash2 } from "lucide-react";
import { EntityActivity } from "@/components/comments/entity-activity";
import { EntityComments } from "@/components/comments/entity-comments";
import { FormFooter, FormFooterError, useFormAction } from "@/components/quick-create/shared";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputClass, textareaClass } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { dateInAR, formatShortDate } from "@/lib/dates";
import { ISSUE_STATUSES, type IssueStatus } from "@/lib/issues/constants";
import { deleteIssue, takeIssue, updateIssue } from "@/lib/issues/actions";
import type { IssueItem } from "@/lib/issues/types";
import { ISSUE_CATEGORIES, type IssueCategory } from "@/lib/quick-create/constants";
import { PRIORITIES, type Priority } from "@/lib/tasks/constants";
import { getTaskFormOptions } from "@/lib/tasks/actions";
import type { TaskFormOptions } from "@/lib/tasks/types";

interface IssueDialogApi {
  open: (issue: IssueItem) => void;
}

const IssueDialogContext = createContext<IssueDialogApi | null>(null);

export function useIssueDialog(): IssueDialogApi {
  const api = useContext(IssueDialogContext);
  if (!api) throw new Error("useIssueDialog se usa dentro de <IssueDialogProvider>");
  return api;
}

// El detalle de un problema: editarlo, tomarlo de la bandeja, comentarlo y ver su historial.
// Reportar uno nuevo se hace con el formulario de creación rápida ("Reportar problema").
export function IssueDialogProvider({ children }: { children: React.ReactNode }) {
  const [issue, setIssue] = useState<IssueItem | null>(null);
  const [options, setOptions] = useState<TaskFormOptions | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Las personas se piden cada vez que se abre, así siempre están al día.
  const loadOptions = useCallback(() => {
    setLoadFailed(false);
    getTaskFormOptions().then(setOptions, () => setLoadFailed(true));
  }, []);

  const api = useMemo<IssueDialogApi>(
    () => ({
      open: (next) => {
        setIssue(next);
        loadOptions();
      },
    }),
    [loadOptions],
  );
  const close = useCallback(() => setIssue(null), []);

  return (
    <IssueDialogContext.Provider value={api}>
      {children}
      <Modal open={issue !== null} onClose={close} title="Problema">
        {issue &&
          (options ? (
            <IssueEditor key={issue.id} issue={issue} options={options} onClose={close} />
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
    </IssueDialogContext.Provider>
  );
}

type Tab = "details" | "comments" | "activity";

const TABS = [
  { id: "details", label: "Detalles" },
  { id: "comments", label: "Comentarios" },
  { id: "activity", label: "Historial" },
] as const;

function IssueEditor({ issue, options, onClose }: { issue: IssueItem; options: TaskFormOptions; onClose: () => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("details");
  const [commentsOpened, setCommentsOpened] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const [category, setCategory] = useState<IssueCategory>(issue.category);
  const [priority, setPriority] = useState<Priority>(issue.priority);
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [assigneeId, setAssigneeId] = useState(issue.assigneeId ?? "");
  const [description, setDescription] = useState(issue.description ?? "");
  const [steps, setSteps] = useState(issue.steps ?? "");

  const finish = (message: string) => {
    onClose();
    toast(message);
  };
  const save = useFormAction(finish, "Problema actualizado");
  const take = useFormAction(finish, "Lo tomaste vos");
  const removal = useFormAction(finish, "Problema eliminado");

  // Si el problema tiene a alguien que ya no figura en la lista, se sigue mostrando.
  const people =
    !issue.assignee || options.people.some((person) => person.id === issue.assigneeId)
      ? options.people
      : [...options.people, { ...issue.assignee, defaultArea: null }];

  function select(next: Tab) {
    setTab(next);
    if (next === "comments") setCommentsOpened(true);
  }

  function remove() {
    if (!window.confirm("¿Eliminar este problema? Esta acción no se puede deshacer.")) return;
    removal.run(() => deleteIssue(issue.id));
  }

  return (
    <div>
      <Tabs tabs={TABS} value={tab} onChange={select} idPrefix="issue" label="Secciones del problema" />

      <div role="tabpanel" id="issue-panel-details" aria-labelledby="issue-tab-details" hidden={tab !== "details"}>
        <p className="mb-4 text-sm text-muted">
          {issue.reporter ? `Lo reportó ${issue.reporter.fullName}` : "Reportado"} el {formatShortDate(dateInAR(issue.createdAt))}
          {issue.resolvedAt && ` · resuelto el ${formatShortDate(dateInAR(issue.resolvedAt))}`}
        </p>

        {!issue.assigneeId && (
          <section className="mb-5 rounded-2xl bg-bordo-soft/60 p-4">
            <h3 className="text-sm font-semibold text-ink">Está en la bandeja de Sistemas</h3>
            <p className="mt-0.5 text-sm text-muted">Nadie lo tomó todavía. Podés tomarlo vos o asignárselo a alguien abajo.</p>
            <Button className="mt-3" onClick={() => take.run(() => takeIssue(issue.id))} disabled={take.pending}>
              <HandHelping className="size-4" aria-hidden />
              {take.pending ? "Guardando…" : "Lo tomo yo"}
            </Button>
            <FormFooterError error={take.error} />
          </section>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.run(() =>
              updateIssue(issue.id, {
                title,
                category,
                priority,
                status,
                assigneeId: assigneeId || null,
                description,
                steps: category === "bug" ? steps : "",
              }),
            );
          }}
          className="space-y-4"
        >
          <Field label="¿Qué pasó?">
            <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} className={inputClass} />
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

            <Field label="Etapa" hint={status === "produccion" ? "Al pasarlo a producción se le avisa a quien lo reportó." : undefined}>
              <select value={status} onChange={(event) => setStatus(event.target.value as IssueStatus)} className={inputClass}>
                {ISSUE_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Responsable">
              <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} className={inputClass}>
                <option value="">Bandeja de Sistemas</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName}
                    {person.id === options.meId ? " (yo)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Detalle (opcional)">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={5000}
              rows={3}
              className={textareaClass}
            />
          </Field>

          {category === "bug" && (
            <Field label="Pasos para reproducirlo (opcional)">
              <textarea
                value={steps}
                onChange={(event) => setSteps(event.target.value)}
                maxLength={5000}
                rows={4}
                placeholder={"1. Abrir un pedido.\n2. Cambiar la cantidad de un producto.\n3. …"}
                className={textareaClass}
              />
            </Field>
          )}

          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={remove}
              disabled={save.pending || removal.pending}
              className="text-prio-urgent hover:text-prio-urgent"
            >
              <Trash2 className="size-4" aria-hidden />
              Eliminar problema
            </Button>
            <FormFooterError error={removal.error} />
          </div>

          <FormFooter
            error={save.error}
            pending={save.pending}
            submitLabel="Guardar cambios"
            canSubmit={!!title.trim()}
            onCancel={onClose}
          />
        </form>
      </div>

      {commentsOpened && (
        <div role="tabpanel" id="issue-panel-comments" aria-labelledby="issue-tab-comments" hidden={tab !== "comments"}>
          <EntityComments entityType="system_issue" entityId={issue.id} />
        </div>
      )}
      {tab === "activity" && (
        <div role="tabpanel" id="issue-panel-activity" aria-labelledby="issue-tab-activity">
          <EntityActivity entityType="system_issue" entityId={issue.id} />
        </div>
      )}
    </div>
  );
}
