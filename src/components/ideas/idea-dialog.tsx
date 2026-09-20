"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { Rocket, SquareCheckBig, Trash2 } from "lucide-react";
import { EntityActivity } from "@/components/comments/entity-activity";
import { EntityComments } from "@/components/comments/entity-comments";
import { useCreateDialog } from "@/components/quick-create/create-dialog";
import { FormFooter, useFormAction } from "@/components/quick-create/shared";
import { useTaskDialog } from "@/components/tasks/task-dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputClass, textareaClass } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";
import { deleteIdea, updateIdea } from "@/lib/ideas/actions";
import { isConverted } from "@/lib/ideas/filters";
import type { IdeaItem } from "@/lib/ideas/types";
import { AREAS, type Area } from "@/lib/tasks/constants";

interface IdeaDialogApi {
  open: (idea: IdeaItem) => void;
}

const IdeaDialogContext = createContext<IdeaDialogApi | null>(null);

export function useIdeaDialog(): IdeaDialogApi {
  const api = useContext(IdeaDialogContext);
  if (!api) throw new Error("useIdeaDialog se usa dentro de <IdeaDialogProvider>");
  return api;
}

// El detalle de una idea: editarla, convertirla, comentarla y ver su historial.
export function IdeaDialogProvider({ children }: { children: React.ReactNode }) {
  const [idea, setIdea] = useState<IdeaItem | null>(null);
  const api = useMemo<IdeaDialogApi>(() => ({ open: setIdea }), []);
  const close = useCallback(() => setIdea(null), []);

  return (
    <IdeaDialogContext.Provider value={api}>
      {children}
      <Modal open={idea !== null} onClose={close} title="Idea">
        {idea && <IdeaEditor key={idea.id} idea={idea} onClose={close} />}
      </Modal>
    </IdeaDialogContext.Provider>
  );
}

type Tab = "details" | "comments" | "activity";

const TABS = [
  { id: "details", label: "Detalles" },
  { id: "comments", label: "Comentarios" },
  { id: "activity", label: "Historial" },
] as const;

function IdeaEditor({ idea, onClose }: { idea: IdeaItem; onClose: () => void }) {
  const toast = useToast();
  const { openNew: openNewTask } = useTaskDialog();
  const { openProject } = useCreateDialog();

  const [tab, setTab] = useState<Tab>("details");
  const [commentsOpened, setCommentsOpened] = useState(false);
  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description ?? "");
  const [area, setArea] = useState<Area | "">(idea.area ?? "");

  const finish = (message: string) => {
    onClose();
    toast(message);
  };
  const save = useFormAction(finish, "Idea actualizada");
  const removal = useFormAction(finish, "Idea eliminada");
  const converted = isConverted(idea);

  function select(next: Tab) {
    setTab(next);
    if (next === "comments") setCommentsOpened(true);
  }

  // Se convierte con lo que hay en el formulario en este momento (incluye cambios sin guardar).
  function convertToTask() {
    onClose();
    openNewTask({ title, description, area: area || null, ideaId: idea.id });
  }

  function convertToProject() {
    onClose();
    openProject({ name: title, description, ideaId: idea.id });
  }

  function remove() {
    if (!window.confirm("¿Eliminar esta idea? Lo que se haya creado a partir de ella no se borra.")) return;
    removal.run(() => deleteIdea(idea.id));
  }

  return (
    <div>
      <Tabs tabs={TABS} value={tab} onChange={select} idPrefix="idea" label="Secciones de la idea" />

      <div role="tabpanel" id="idea-panel-details" aria-labelledby="idea-tab-details" hidden={tab !== "details"}>
        <p className="mb-4 text-sm text-muted">
          {idea.creator ? `La propuso ${idea.creator.fullName}` : "Propuesta"} · {formatRelativeTime(idea.createdAt)} ·{" "}
          {idea.votes === 1 ? "1 voto" : `${idea.votes} votos`}
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.run(() => updateIdea(idea.id, { title, description, area: area || null }));
          }}
          className="space-y-4"
        >
          <Field label="Idea">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={200}
              className={inputClass}
            />
          </Field>

          <Field label="Descripción (opcional)">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={5000}
              rows={4}
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

          <FormFooter
            error={save.error}
            pending={save.pending}
            submitLabel="Guardar cambios"
            canSubmit={!!title.trim()}
            onCancel={onClose}
          />
        </form>

        <section className="mt-6 border-t border-line pt-5">
          <h3 className="font-display text-lg font-semibold text-ink">Convertir esta idea</h3>
          {converted ? (
            <p className="mt-2 text-sm text-muted">
              Esta idea ya se convirtió en{" "}
              {idea.convertedProject ? (
                <>
                  el proyecto{" "}
                  <Link
                    href={`/proyectos/${idea.convertedProject.id}`}
                    onClick={onClose}
                    className="font-semibold text-bordo underline underline-offset-4"
                  >
                    {idea.convertedProject.name}
                  </Link>
                </>
              ) : (
                <>
                  la tarea <span className="font-semibold text-ink">{idea.convertedTask?.title}</span>
                </>
              )}
              .
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">
                Se abre el formulario ya completo con esta idea, para que lo revises antes de crearlo.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="soft" onClick={convertToTask} disabled={!title.trim()}>
                  <SquareCheckBig className="size-4" aria-hidden />
                  Convertir en tarea
                </Button>
                <Button variant="soft" onClick={convertToProject} disabled={!title.trim()}>
                  <Rocket className="size-4" aria-hidden />
                  Convertir en proyecto
                </Button>
              </div>
            </>
          )}
        </section>

        <div className="mt-6 border-t border-line pt-4">
          {removal.error && (
            <p role="alert" className="mb-3 rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
              {removal.error}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={removal.pending || save.pending}
            className="text-prio-urgent hover:text-prio-urgent"
          >
            <Trash2 className="size-4" aria-hidden />
            Eliminar idea
          </Button>
        </div>
      </div>

      {commentsOpened && (
        <div role="tabpanel" id="idea-panel-comments" aria-labelledby="idea-tab-comments" hidden={tab !== "comments"}>
          <EntityComments entityType="idea" entityId={idea.id} />
        </div>
      )}
      {tab === "activity" && (
        <div role="tabpanel" id="idea-panel-activity" aria-labelledby="idea-tab-activity">
          <EntityActivity entityType="idea" entityId={idea.id} />
        </div>
      )}
    </div>
  );
}
