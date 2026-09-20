"use client";

import { useMemo, useOptimistic, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useContentDialog } from "@/components/content/content-dialog";
import { useCreateDialog } from "@/components/quick-create/create-dialog";
import { useTaskDialog } from "@/components/tasks/task-dialog";
import { moveCalendarItem } from "@/lib/calendar/actions";
import { itemsByDay } from "@/lib/calendar/items";
import { shiftItem } from "@/lib/calendar/move";
import { calendarQuery, type CalendarState } from "@/lib/calendar/params";
import { WEEKDAY_LABELS, daysOfWeek, inSameMonth, monthWeeks, startOfMonth } from "@/lib/calendar/range";
import type { CalendarItem } from "@/lib/calendar/types";
import { diffDays, formatLongDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES, KIND_ICONS, NEUTRAL_STYLE, styleFor } from "./styles";

const MAX_CHIPS_PER_DAY = 3;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

interface DragData {
  item: CalendarItem;
  /** El día desde el que se lo agarró (un evento de varios días se puede agarrar de cualquiera). */
  day: string;
}

interface Move {
  key: string;
  days: number;
}

interface CalendarBoardProps {
  state: CalendarState;
  today: string;
  items: CalendarItem[];
}

// Pointer primero (el día que está bajo el cursor); si se suelta justo en el borde, cae al que más se superpone.
const detectDay: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

const dayNumber = (day: string) => Number(day.slice(8));

export function CalendarBoard({ state, today, items }: CalendarBoardProps) {
  const { openEdit: openTask } = useTaskDialog();
  const { openNewEvent, openEditEvent } = useCreateDialog();
  const { open: openContent } = useContentDialog();

  // El elemento se mueve al instante; si el servidor falla, vuelve solo a su día y se avisa.
  const [shown, applyMove] = useOptimistic(items, (current, move: Move) =>
    current.map((item) => (item.key === move.key ? shiftItem(item, move.days) : item)),
  );
  const [, startTransition] = useTransition();
  const [dragging, setDragging] = useState<DragData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // En el celular la grilla del mes muestra solo puntos: el día elegido se lee abajo, como agenda.
  const [selectedDay, setSelectedDay] = useState(() =>
    inSameMonth(today, state.date) ? today : startOfMonth(state.date),
  );

  const weeks = useMemo(
    () => (state.view === "mes" ? monthWeeks(state.date) : [daysOfWeek(state.date)]),
    [state.view, state.date],
  );
  const byDay = useMemo(() => itemsByDay(shown, weeks.flat()), [shown, weeks]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), // así un clic común sigue abriendo el elemento
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }), // mantener apretado para arrastrar; deslizar hace scroll
  );

  function openItem(item: CalendarItem) {
    if (item.kind === "event" && item.event) openEditEvent(item.event);
    else if (item.kind === "task" && item.task) openTask(item.task);
    else if (item.kind === "content" && item.content) openContent(item.content);
  }

  function handleDragStart({ active }: DragStartEvent) {
    setDragging((active.data.current as DragData | undefined) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragging(null);
    const data = active.data.current as DragData | undefined;
    const target = over ? String(over.id) : "";
    if (!data || !DAY.test(target) || target === data.day) return;

    setError(null);
    startTransition(async () => {
      applyMove({ key: data.item.key, days: diffDays(target, data.day) });
      const result = await moveCalendarItem(data.item.kind, data.item.id, data.day, target);
      if (!result.ok) setError(result.error);
    });
  }

  const describe = (data: DragData | undefined) => (data ? `"${data.item.title}"` : "el elemento");
  // Mensajes para lectores de pantalla, en español (por defecto vienen en inglés).
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste ${describe(active.data.current as DragData | undefined)}.`,
    onDragOver: ({ active, over }) =>
      over && DAY.test(String(over.id))
        ? `${describe(active.data.current as DragData | undefined)} está sobre el ${formatLongDate(String(over.id))}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over && DAY.test(String(over.id))
        ? `Soltaste ${describe(active.data.current as DragData | undefined)} el ${formatLongDate(String(over.id))}.`
        : `Soltaste ${describe(active.data.current as DragData | undefined)} fuera del calendario.`,
    onDragCancel: ({ active }) => `Cancelaste el movimiento de ${describe(active.data.current as DragData | undefined)}.`,
  };

  const weekHref = (day: string) => `/calendario${calendarQuery({ ...state, view: "semana", date: day }, today)}`;

  const chipProps = (item: CalendarItem, day: string, compact: boolean) => ({
    item,
    day,
    compact,
    onOpen: () => openItem(item),
  });

  const selectedItems = byDay.get(selectedDay) ?? [];

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-prio-urgent/10 px-4 py-3 text-sm text-prio-urgent">
          {error}
        </p>
      )}

      <DndContext
        id="calendar"
        sensors={sensors}
        collisionDetection={detectDay}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDragging(null)}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable: "Para cambiar la fecha con el teclado, abrí el elemento y elegí otro día.",
          },
        }}
      >
        {state.view === "mes" ? (
          <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
            <div className="grid grid-cols-7 bg-beige-deep/40">
              {WEEKDAY_LABELS.map((label) => (
                <p key={label} className="py-2 text-center text-xs font-bold uppercase tracking-wide text-muted">
                  {label}
                </p>
              ))}
            </div>
            {weeks.map((week) => (
              <div key={week[0]} className="grid grid-cols-7 border-t border-line">
                {week.map((day) => (
                  <MonthCell
                    key={day}
                    day={day}
                    today={today}
                    outside={!inSameMonth(day, state.date)}
                    selected={day === selectedDay}
                    items={byDay.get(day) ?? []}
                    weekHref={weekHref(day)}
                    onSelect={() => setSelectedDay(day)}
                    onAdd={() => openNewEvent({ date: day })}
                    renderChip={(item) => <DraggableChip {...chipProps(item, day, true)} />}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-7">
            {weeks[0].map((day, index) => (
              <WeekDay
                key={day}
                day={day}
                weekday={WEEKDAY_LABELS[index]}
                today={today}
                items={byDay.get(day) ?? []}
                onAdd={() => openNewEvent({ date: day })}
                renderChip={(item) => <DraggableChip {...chipProps(item, day, false)} />}
              />
            ))}
          </div>
        )}

        <DragOverlay dropAnimation={null}>
          {dragging ? (
            <ItemChip item={dragging.item} day={dragging.day} compact={state.view === "mes"} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {state.view === "mes" && (
        <section aria-label={`Agenda del ${formatLongDate(selectedDay)}`} className="mt-4 rounded-3xl border border-line bg-surface p-4 shadow-card md:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">{formatLongDate(selectedDay)}</h2>
            <button
              type="button"
              onClick={() => openNewEvent({ date: selectedDay })}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-bordo-soft px-3.5 text-sm font-semibold text-bordo transition hover:bg-bordo/15"
            >
              <Plus className="size-4" aria-hidden />
              Evento
            </button>
          </div>
          {selectedItems.length > 0 ? (
            <ul className="space-y-2">
              {selectedItems.map((item) => (
                <li key={item.key}>
                  <ItemChip item={item} day={selectedDay} compact={false} onOpen={() => openItem(item)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No hay nada este día.</p>
          )}
        </section>
      )}

      <Legend />
    </div>
  );
}

// ---------- Días (zonas donde se puede soltar) ----------

function DropZone({ day, className, children }: { day: string; className?: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: day });
  return (
    <div ref={setNodeRef} className={cn(className, isOver && "bg-bordo-soft ring-2 ring-inset ring-bordo/40")}>
      {children}
    </div>
  );
}

interface MonthCellProps {
  day: string;
  today: string;
  /** ¿Es un día de otro mes (relleno de la primera o la última semana)? */
  outside: boolean;
  selected: boolean;
  items: CalendarItem[];
  weekHref: string;
  onSelect: () => void;
  onAdd: () => void;
  renderChip: (item: CalendarItem) => ReactNode;
}

function MonthCell({ day, today, outside, selected, items, weekHref, onSelect, onAdd, renderChip }: MonthCellProps) {
  const isToday = day === today;
  const visible = items.slice(0, MAX_CHIPS_PER_DAY);
  const hidden = items.length - visible.length;
  const numberClass = cn(
    "items-center justify-center rounded-full text-sm font-semibold",
    isToday ? "bg-bordo text-beige" : outside ? "text-muted" : "text-ink",
  );

  return (
    <DropZone
      day={day}
      className={cn(
        "group relative min-h-16 border-l border-line p-1 first:border-l-0 md:min-h-32 md:p-1.5",
        outside && "bg-beige/50",
        selected && "max-md:bg-bordo-soft",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        {/* Con más lugar, el número lleva a la semana; en el celular se toca el día entero (ver abajo). */}
        <Link
          href={weekHref}
          aria-label={`Ver la semana del ${formatLongDate(day)}`}
          className={cn(numberClass, "hidden size-7 transition md:inline-flex", !isToday && "hover:bg-bordo-soft")}
        >
          {dayNumber(day)}
        </Link>
        <span className={cn(numberClass, "inline-flex size-6 text-xs md:hidden")}>{dayNumber(day)}</span>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Nuevo evento el ${formatLongDate(day)}`}
          className="hidden size-7 items-center justify-center rounded-full text-muted opacity-0 transition hover:bg-bordo-soft hover:text-bordo focus-visible:opacity-100 group-hover:opacity-100 md:inline-flex"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>

      {items.length > 0 && (
        <ul className="mt-1 hidden space-y-1 md:block">
          {visible.map((item) => (
            <li key={item.key}>{renderChip(item)}</li>
          ))}
          {hidden > 0 && (
            <li>
              <Link href={weekHref} className="block rounded-md px-1.5 py-0.5 text-xs font-semibold text-bordo hover:bg-bordo-soft">
                +{hidden} más
              </Link>
            </li>
          )}
        </ul>
      )}

      {items.length > 0 && (
        <div className="mt-1 flex flex-wrap justify-center gap-0.5 md:hidden" aria-hidden>
          {items.slice(0, 4).map((item) => (
            <span key={item.key} className={cn("size-1.5 rounded-full", styleFor(item.category).dot)} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onSelect}
        aria-label={`Ver el ${formatLongDate(day)}`}
        aria-pressed={selected}
        className="absolute inset-0 md:hidden"
      />
    </DropZone>
  );
}

interface WeekDayProps {
  day: string;
  weekday: string;
  today: string;
  items: CalendarItem[];
  onAdd: () => void;
  renderChip: (item: CalendarItem) => ReactNode;
}

function WeekDay({ day, weekday, today, items, onAdd, renderChip }: WeekDayProps) {
  const isToday = day === today;
  return (
    <DropZone day={day} className={cn("rounded-2xl border bg-surface p-3 shadow-card xl:min-h-72", isToday ? "border-bordo/50" : "border-line")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 xl:flex-col xl:items-start xl:gap-0.5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{weekday}</p>
          <p
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold",
              isToday ? "bg-bordo text-beige" : "text-ink",
            )}
          >
            {dayNumber(day)}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Nuevo evento el ${formatLongDate(day)}`}
          className="inline-flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-bordo-soft hover:text-bordo"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.key}>{renderChip(item)}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted">Nada este día.</p>
      )}
    </DropZone>
  );
}

// ---------- Elementos ----------

interface ItemChipProps {
  item: CalendarItem;
  day: string;
  /** Una sola línea (grilla del mes) o con detalle (semana y agenda). */
  compact: boolean;
  onOpen?: () => void;
  /** La copia que sigue al cursor mientras se arrastra. */
  overlay?: boolean;
}

function ItemChip({ item, day, compact, onOpen, overlay }: ItemChipProps) {
  const Icon = KIND_ICONS[item.kind];
  const summary = `${item.label}: ${item.title}${item.time ? `, ${item.time}` : ""}${item.done ? " (listo)" : ""}`;
  // Un evento de varios días se repite en cada día; se marca cuál es el primero.
  const continues = item.start < day;

  return (
    <div className={cn("rounded-lg border-l-[3px] text-xs", styleFor(item.category).chip, overlay && "rotate-1 shadow-float")}>
      <button
        type="button"
        onClick={onOpen}
        title={summary}
        aria-label={summary}
        className="flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left text-ink outline-offset-1 focus-visible:outline-2 focus-visible:outline-bordo"
      >
        <Icon className="mt-0.5 size-3 shrink-0 text-muted" aria-hidden />
        <span className={cn("min-w-0 flex-1 font-medium", compact && "truncate", item.done && "text-muted line-through")}>
          {item.time && <span className="mr-1 font-semibold">{item.time}</span>}
          {continues && <span aria-hidden>↳ </span>}
          {item.title}
        </span>
      </button>
      {!compact && (
        <p className="pb-1 pl-[1.625rem] pr-1.5 text-[11px] text-muted">
          {item.label}
          {item.person && ` · ${item.person.fullName}`}
        </p>
      )}
    </div>
  );
}

function DraggableChip(props: ItemChipProps) {
  const { item, day } = props;
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: `${item.key}|${day}`,
    data: { item, day } satisfies DragData,
    disabled: !item.movable,
  });

  return (
    <div ref={setNodeRef} {...listeners} className={cn(isDragging && "opacity-40")}>
      <ItemChip {...props} />
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-5 space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted" aria-label="Colores por categoría">
        {[...Object.values(CATEGORY_STYLES), NEUTRAL_STYLE].map((style) => (
          <li key={style.label} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", style.dot)} aria-hidden />
            {style.label}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        Arrastrá un evento, una tarea o una publicación a otro día para cambiar su fecha (en el celular, mantenelo apretado un
        momento).
      </p>
    </div>
  );
}
