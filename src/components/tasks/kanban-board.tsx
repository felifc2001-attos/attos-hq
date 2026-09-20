"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FolderKanban, Lock } from "lucide-react";
import { PersonAvatar } from "@/components/ui/avatar";
import { Badge, BADGE_TONES } from "@/components/ui/badge";
import { formatDueLabel } from "@/lib/dates";
import { moveTask } from "@/lib/tasks/actions";
import {
  KANBAN_DONE_DAYS,
  PRIORITIES,
  STATUSES,
  findOption,
  type TaskStatus,
} from "@/lib/tasks/constants";
import { planMove, positionAtEnd, sortByPosition } from "@/lib/tasks/kanban";
import type { Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { useTaskDialog } from "./task-dialog";

const STATUS_VALUES: readonly string[] = STATUSES.map((status) => status.value);

interface Move {
  id: string;
  status: TaskStatus;
  position: number;
}

interface KanbanBoardProps {
  tasks: Task[];
  /** El día de hoy (YYYY-MM-DD), calculado en el servidor. */
  today: string;
}

export function KanbanBoard({ tasks, today }: KanbanBoardProps) {
  // La tarjeta se mueve al instante; si el servidor falla, vuelve sola a su lugar y se avisa.
  const [items, applyMove] = useOptimistic(tasks, (current, move: Move) =>
    current.map((task) =>
      task.id === move.id ? { ...task, status: move.status, position: move.position } : task,
    ),
  );
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), // así un clic común sigue abriendo la tarea
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }), // mantener apretado para arrastrar; deslizar hace scroll
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function commit(move: Move) {
    setError(null);
    startTransition(async () => {
      applyMove(move);
      const result = await moveTask(move.id, move.status, move.position);
      if (!result.ok) setError(result.error);
    });
  }

  const columnOf = (id: UniqueIdentifier | undefined): string | null => {
    if (id === undefined) return null;
    if (STATUS_VALUES.includes(String(id))) return String(id);
    return items.find((task) => task.id === id)?.status ?? null;
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverColumn(columnOf(event.over?.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;

    // ¿Se soltó en la mitad de abajo de la tarjeta de destino?
    const dragged = active.rect.current.translated;
    const placeAfter = !!dragged && dragged.top + dragged.height / 2 > over.rect.top + over.rect.height / 2;

    const plan = planMove(items, String(active.id), String(over.id), placeAfter, STATUS_VALUES);
    if (plan) commit({ id: String(active.id), status: plan.status as TaskStatus, position: plan.position });
  }

  function handleStatusSelect(task: Task, status: TaskStatus) {
    if (status === task.status) return;
    commit({ id: task.id, status, position: positionAtEnd(items, status, task.id) });
  }

  const describe = (id: UniqueIdentifier | undefined): string => {
    if (id === undefined) return "";
    const column = STATUSES.find((status) => status.value === id);
    if (column) return `la columna ${column.label}`;
    const task = items.find((item) => item.id === id);
    return task ? `la tarea ${task.title}` : "";
  };

  // Mensajes para lectores de pantalla, en español (por defecto vienen en inglés).
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste ${describe(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${describe(active.id)} está sobre ${describe(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) =>
      over ? `Soltaste ${describe(active.id)} sobre ${describe(over.id)}.` : `Soltaste ${describe(active.id)} fuera del tablero.`,
    onDragCancel: ({ active }) => `Cancelaste el movimiento de ${describe(active.id)}.`,
  };

  const activeTask = items.find((task) => task.id === activeId) ?? null;

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
          {error}
        </p>
      )}

      <DndContext
        id="tasks-kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setOverColumn(null);
        }}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Para mover una tarea, enfocala y apretá la barra espaciadora. Usá las flechas para llevarla a otro lugar y volvé a apretar espacio para soltarla. Escape cancela.",
          },
        }}
      >
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status.value}
              status={status.value}
              label={status.label}
              tone={status.tone}
              tasks={sortByPosition(items.filter((task) => task.status === status.value))}
              today={today}
              highlighted={activeId !== null && overColumn === status.value}
              onChangeStatus={handleStatusSelect}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? <KanbanCardBody task={activeTask} today={today} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <p className="mt-2 text-xs text-muted">
        Arrastrá las tarjetas entre columnas para cambiar su estado. En &ldquo;Listo&rdquo; se ven las de los últimos{" "}
        {KANBAN_DONE_DAYS} días.
      </p>
    </div>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tone: keyof typeof BADGE_TONES;
  tasks: Task[];
  today: string;
  highlighted: boolean;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
}

function KanbanColumn({ status, label, tone, tasks, today, highlighted, onChangeStatus }: KanbanColumnProps) {
  // La columna entera es una zona de destino, para poder soltar en una columna vacía.
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <section
      aria-label={`${label}, ${tasks.length} ${tasks.length === 1 ? "tarea" : "tareas"}`}
      className={cn(
        "w-[85%] max-w-[22rem] shrink-0 snap-start rounded-3xl p-3 transition-colors lg:w-auto lg:max-w-none",
        highlighted ? "bg-bordo-soft" : "bg-beige-deep/45",
      )}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <Badge tone={tone}>{label}</Badge>
        <span className="text-xs font-semibold text-muted">{tasks.length}</span>
      </header>

      <SortableContext id={status} items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="min-h-28 space-y-3">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} today={today} onChangeStatus={onChangeStatus} />
          ))}
          {tasks.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line py-8 text-center text-xs text-muted">
              Soltá una tarea acá
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

interface KanbanCardProps {
  task: Task;
  today: string;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
}

function KanbanCard({ task, today, onChangeStatus }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        // Sin esto, apretar Enter sobre el título (un botón) arrancaría el arrastre en vez de abrir la tarea.
        setActivatorNodeRef(node);
      }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="group"
      className={cn("rounded-2xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-bordo", isDragging && "opacity-40")}
    >
      <KanbanCardBody task={task} today={today} onChangeStatus={onChangeStatus} />
    </div>
  );
}

interface KanbanCardBodyProps {
  task: Task;
  today: string;
  onChangeStatus?: (task: Task, status: TaskStatus) => void;
  /** La copia que sigue al cursor mientras se arrastra. */
  overlay?: boolean;
}

function KanbanCardBody({ task, today, onChangeStatus, overlay }: KanbanCardBodyProps) {
  const { openEdit } = useTaskDialog();
  const priority = findOption(PRIORITIES, task.priority);
  const done = task.status === "listo";
  const overdue = !done && task.dueDate !== null && task.dueDate < today;

  return (
    <div
      className={cn(
        "rounded-2xl border border-line/70 bg-surface p-3.5 shadow-card",
        overlay && "rotate-2 cursor-grabbing shadow-float",
      )}
    >
      <button
        type="button"
        onClick={() => openEdit(task)}
        className={cn(
          "block w-full text-left text-sm font-semibold leading-snug transition hover:text-bordo",
          done ? "text-muted line-through" : "text-ink",
        )}
      >
        {task.title}
      </button>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <Badge tone={priority.tone}>{priority.label}</Badge>
        {task.dueDate && (
          <span
            className={cn(
              "text-xs font-semibold",
              overdue ? "text-prio-urgent" : task.dueDate === today && !done ? "text-bordo" : "text-muted",
            )}
          >
            {formatDueLabel(task.dueDate, today)}
          </span>
        )}
      </div>

      {task.project && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <FolderKanban className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{task.project.name}</span>
        </p>
      )}

      {task.blockedBy.length > 0 && !done && (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-prio-high">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>Esperando a {task.blockedBy.map((item) => item.providerName).join(", ")}</span>
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {/* Alternativa al arrastre (útil en el celular): cambiar de columna con el selector. */}
        <select
          value={task.status}
          onChange={(event) => onChangeStatus?.(task, event.target.value as TaskStatus)}
          disabled={!onChangeStatus}
          aria-label={`Mover "${task.title}" a otra columna`}
          className={cn(
            "cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-bordo",
            BADGE_TONES[findOption(STATUSES, task.status).tone],
          )}
        >
          {STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {task.assignee ? (
          <PersonAvatar person={task.assignee} size="sm" />
        ) : (
          <span
            className="inline-flex size-8 items-center justify-center rounded-full border border-dashed border-line text-xs text-muted"
            title="Sin asignar"
          >
            ?
          </span>
        )}
      </div>
    </div>
  );
}
