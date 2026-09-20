"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
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
import { Badge, BADGE_TONES, type BadgeTone } from "@/components/ui/badge";
import { planMove, positionAtEnd, sortByPosition } from "@/lib/tasks/kanban";
import type { ActionResult } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

export interface PipelineColumn {
  value: string;
  label: string;
  tone: BadgeTone;
}

export interface PipelineItem {
  id: string;
  status: string;
  position: number;
}

interface Move {
  id: string;
  status: string;
  position: number;
}

interface PipelineBoardProps<T extends PipelineItem> {
  /** Distingue este tablero de otros en la misma página (lo pide dnd-kit). */
  id: string;
  columns: readonly PipelineColumn[];
  items: T[];
  /** Guarda el movimiento en el servidor. Si falla, la tarjeta vuelve sola a su lugar y se muestra el error. */
  onMove: (id: string, status: string, position: number) => Promise<ActionResult>;
  /** El contenido de una tarjeta (con su botón para abrirla). */
  renderCard: (item: T) => ReactNode;
  /** Cómo se nombra una tarjeta para los lectores de pantalla y el selector de columna. */
  describeItem: (item: T) => string;
  /** Texto de una columna vacía. */
  emptyText: string;
  /** Aclaración debajo del tablero. */
  hint?: ReactNode;
}

// Un tablero de columnas con tarjetas que se arrastran entre ellas. Sirve para cualquier cosa que tenga
// un estado y una posición: la lógica de dónde queda cada tarjeta es la misma que la del Kanban de tareas.
export function PipelineBoard<T extends PipelineItem>({
  id,
  columns,
  items: serverItems,
  onMove,
  renderCard,
  describeItem,
  emptyText,
  hint,
}: PipelineBoardProps<T>) {
  const [items, applyMove] = useOptimistic(serverItems, (current, move: Move) =>
    current.map((item) => (item.id === move.id ? { ...item, status: move.status, position: move.position } : item)),
  );
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columnValues = columns.map((column) => column.value);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), // así un clic común sigue abriendo la tarjeta
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }), // mantener apretado para arrastrar; deslizar hace scroll
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function commit(move: Move) {
    setError(null);
    startTransition(async () => {
      applyMove(move);
      const result = await onMove(move.id, move.status, move.position);
      if (!result.ok) setError(result.error);
    });
  }

  const columnOf = (overId: UniqueIdentifier | undefined): string | null => {
    if (overId === undefined) return null;
    if (columnValues.includes(String(overId))) return String(overId);
    return items.find((item) => item.id === overId)?.status ?? null;
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverColumn(columnOf(event.over?.id));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;

    // ¿Se soltó en la mitad de abajo de la tarjeta de destino?
    const dragged = active.rect.current.translated;
    const placeAfter = !!dragged && dragged.top + dragged.height / 2 > over.rect.top + over.rect.height / 2;

    const plan = planMove(items, String(active.id), String(over.id), placeAfter, columnValues);
    if (plan) commit({ id: String(active.id), status: plan.status, position: plan.position });
  }

  function handleStatusSelect(item: T, status: string) {
    if (status === item.status) return;
    commit({ id: item.id, status, position: positionAtEnd(items, status, item.id) });
  }

  const describe = (overId: UniqueIdentifier | undefined): string => {
    if (overId === undefined) return "";
    const column = columns.find((option) => option.value === overId);
    if (column) return `la columna ${column.label}`;
    const item = items.find((entry) => entry.id === overId);
    return item ? describeItem(item) : "";
  };

  // Mensajes para lectores de pantalla, en español (por defecto vienen en inglés).
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste ${describe(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${describe(active.id)} está sobre ${describe(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) =>
      over ? `Soltaste ${describe(active.id)} sobre ${describe(over.id)}.` : `Soltaste ${describe(active.id)} fuera del tablero.`,
    onDragCancel: ({ active }) => `Cancelaste el movimiento de ${describe(active.id)}.`,
  };

  const activeItem = items.find((item) => item.id === activeId) ?? null;

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
          {error}
        </p>
      )}

      <DndContext
        id={id}
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
              "Para mover una tarjeta, enfocala y apretá la barra espaciadora. Usá las flechas para llevarla a otro lugar y volvé a apretar espacio para soltarla. Escape cancela.",
          },
        }}
      >
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
          {columns.map((column) => (
            <PipelineColumnView
              key={column.value}
              column={column}
              items={sortByPosition(items.filter((item) => item.status === column.value))}
              highlighted={activeId !== null && overColumn === column.value}
              emptyText={emptyText}
              columns={columns}
              renderCard={renderCard}
              describeItem={describeItem}
              onChangeStatus={handleStatusSelect}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeItem ? <CardShell overlay>{renderCard(activeItem)}</CardShell> : null}
        </DragOverlay>
      </DndContext>

      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}

interface ColumnViewProps<T extends PipelineItem> {
  column: PipelineColumn;
  items: T[];
  highlighted: boolean;
  emptyText: string;
  columns: readonly PipelineColumn[];
  renderCard: (item: T) => ReactNode;
  describeItem: (item: T) => string;
  onChangeStatus: (item: T, status: string) => void;
}

function PipelineColumnView<T extends PipelineItem>({
  column,
  items,
  highlighted,
  emptyText,
  columns,
  renderCard,
  describeItem,
  onChangeStatus,
}: ColumnViewProps<T>) {
  // La columna entera es una zona de destino, para poder soltar en una columna vacía.
  const { setNodeRef } = useDroppable({ id: column.value });

  return (
    <section
      aria-label={`${column.label}, ${items.length} ${items.length === 1 ? "tarjeta" : "tarjetas"}`}
      className={cn(
        "w-[80%] max-w-[18rem] shrink-0 snap-start rounded-3xl p-3 transition-colors sm:w-72",
        highlighted ? "bg-bordo-soft" : "bg-beige-deep/45",
      )}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <Badge tone={column.tone}>{column.label}</Badge>
        <span className="text-xs font-semibold text-muted">{items.length}</span>
      </header>

      <SortableContext id={column.value} items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="min-h-28 space-y-3">
          {items.map((item) => (
            <SortableCard key={item.id} id={item.id}>
              <CardShell>
                {renderCard(item)}
                {/* Alternativa al arrastre (útil en el celular): cambiar de columna con el selector. */}
                <select
                  value={item.status}
                  onChange={(event) => onChangeStatus(item, event.target.value)}
                  aria-label={`Mover ${describeItem(item)} a otra columna`}
                  className={cn(
                    "mt-3 cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-bordo",
                    BADGE_TONES[column.tone],
                  )}
                >
                  {columns.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CardShell>
            </SortableCard>
          ))}
          {items.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line py-8 text-center text-xs text-muted">{emptyText}</p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableCard({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        // Sin esto, apretar Enter sobre el título (un botón) arrancaría el arrastre en vez de abrir la tarjeta.
        setActivatorNodeRef(node);
      }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="group"
      className={cn("rounded-2xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-bordo", isDragging && "opacity-40")}
    >
      {children}
    </div>
  );
}

function CardShell({ children, overlay }: { children: ReactNode; overlay?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-line/70 bg-surface p-3.5 shadow-card", overlay && "rotate-2 cursor-grabbing shadow-float")}>
      {children}
    </div>
  );
}
