"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { EditableEvent } from "@/lib/calendar/types";
import type { EditableProject } from "@/lib/projects/types";
import { getCreateOptions } from "@/lib/quick-create/actions";
import type { CreateOptions } from "@/lib/quick-create/types";
import { DependencyForm } from "./dependency-form";
import { EventForm, type EventDefaults } from "./event-form";
import { IdeaForm } from "./idea-form";
import { IssueForm } from "./issue-form";
import { ProjectForm, type ProjectDefaults } from "./project-form";

export type CreateKind = "idea" | "issue" | "event" | "project" | "dependency";

const TITLES: Record<CreateKind, string> = {
  idea: "Nueva idea",
  issue: "Reportar un problema",
  event: "Nuevo evento",
  project: "Nuevo proyecto",
  dependency: "Necesito de…",
};

const FORMS = {
  idea: IdeaForm,
  issue: IssueForm,
  dependency: DependencyForm,
} as const;

interface CreateDialogApi {
  open: (kind: CreateKind) => void;
  /** Proyecto nuevo con datos de partida (por ejemplo, al convertir una idea). */
  openProject: (defaults: ProjectDefaults) => void;
  openEditProject: (project: EditableProject) => void;
  /** Evento nuevo con datos de partida (por ejemplo, el día en que se hizo clic en el calendario). */
  openNewEvent: (defaults?: EventDefaults) => void;
  openEditEvent: (event: EditableEvent) => void;
}

const CreateDialogContext = createContext<CreateDialogApi | null>(null);

export function useCreateDialog(): CreateDialogApi {
  const api = useContext(CreateDialogContext);
  if (!api) throw new Error("useCreateDialog se usa dentro de <CreateDialogProvider>");
  return api;
}

interface DialogState {
  kind: CreateKind;
  projectDefaults?: ProjectDefaults;
  editingProject?: EditableProject;
  eventDefaults?: EventDefaults;
  editingEvent?: EditableEvent;
}

function titleFor(state: DialogState | null): string {
  if (!state) return "";
  if (state.editingProject) return "Editar proyecto";
  if (state.editingEvent) return "Editar evento";
  if (state.projectDefaults?.ideaId) return "Convertir idea en proyecto";
  return TITLES[state.kind];
}

// Un único diálogo para las creaciones rápidas (idea, problema, evento, proyecto y "Necesito de…").
// Las tareas tienen el suyo, porque también sirve para editar (ver task-dialog.tsx).
export function CreateDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const [options, setOptions] = useState<CreateOptions | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const toast = useToast();

  // Personas, proyectos y tareas se piden cada vez que se abre, así siempre están al día.
  const loadOptions = useCallback(() => {
    setLoadFailed(false);
    getCreateOptions().then(setOptions, () => setLoadFailed(true));
  }, []);

  const api = useMemo<CreateDialogApi>(() => {
    const show = (next: DialogState) => {
      setState(next);
      loadOptions();
    };
    return {
      open: (kind) => show({ kind }),
      openProject: (projectDefaults) => show({ kind: "project", projectDefaults }),
      openEditProject: (editingProject) => show({ kind: "project", editingProject }),
      openNewEvent: (eventDefaults) => show({ kind: "event", eventDefaults }),
      openEditEvent: (editingEvent) => show({ kind: "event", editingEvent }),
    };
  }, [loadOptions]);

  const close = useCallback(() => setState(null), []);
  const done = useCallback(
    (message: string) => {
      setState(null);
      toast(message);
    },
    [toast],
  );

  function renderForm(current: DialogState, loaded: CreateOptions) {
    if (current.kind === "project") {
      return (
        <ProjectForm
          options={loaded}
          onDone={done}
          onCancel={close}
          defaults={current.projectDefaults}
          editing={current.editingProject}
        />
      );
    }
    if (current.kind === "event") {
      return (
        <EventForm
          options={loaded}
          onDone={done}
          onCancel={close}
          defaults={current.eventDefaults}
          editing={current.editingEvent}
        />
      );
    }
    const Form = FORMS[current.kind];
    return <Form options={loaded} onDone={done} onCancel={close} />;
  }

  return (
    <CreateDialogContext.Provider value={api}>
      {children}
      <Modal open={state !== null} onClose={close} title={titleFor(state)}>
        {state && options ? (
          renderForm(state, options)
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
      </Modal>
    </CreateDialogContext.Provider>
  );
}
