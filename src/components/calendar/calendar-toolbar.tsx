"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, X, type LucideIcon } from "lucide-react";
import { filterSelectClass } from "@/components/ui/form-controls";
import { CALENDAR_TYPES, type CalendarType } from "@/lib/calendar/items";
import { calendarQuery, hasCalendarFilters, withView, type CalendarState } from "@/lib/calendar/params";
import { shiftPeriod, type CalendarView } from "@/lib/calendar/range";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/quick-create/constants";
import { cn } from "@/lib/utils";

interface CalendarToolbarProps {
  state: CalendarState;
  today: string;
  /** "Septiembre 2026" o "21 – 27 de septiembre 2026" (se arma en el servidor). */
  label: string;
}

const iconLink =
  "inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:bg-beige focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bordo";

export function CalendarToolbar({ state, today, label }: CalendarToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const href = (next: CalendarState) => `/calendario${calendarQuery(next, today)}`;

  function apply(patch: Partial<CalendarState>) {
    startTransition(() => router.replace(href({ ...state, ...patch })));
  }

  const viewLink = (view: CalendarView, text: string, Icon: LucideIcon) => (
    <Link
      href={href(withView(state, view, today))}
      aria-current={state.view === view ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
        state.view === view ? "bg-bordo text-beige shadow-card" : "text-muted hover:text-ink",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {text}
    </Link>
  );

  const unit = state.view === "mes" ? "mes" : "semana";

  return (
    <div className={cn("mb-5 space-y-3 transition-opacity", pending && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href({ ...state, date: shiftPeriod(state.view, state.date, -1) })} aria-label={`${unit === "mes" ? "Mes" : "Semana"} anterior`} className={iconLink}>
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <Link href={href({ ...state, date: shiftPeriod(state.view, state.date, 1) })} aria-label={`${unit === "mes" ? "Mes" : "Semana"} siguiente`} className={iconLink}>
            <ChevronRight className="size-5" aria-hidden />
          </Link>
          <h2 aria-live="polite" className="mx-1 font-display text-xl font-semibold text-ink sm:text-2xl">
            {label}
          </h2>
          <Link
            href={href({ ...state, date: today })}
            className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3.5 text-sm font-semibold text-ink transition hover:bg-beige"
          >
            Hoy
          </Link>
        </div>

        <nav aria-label="Cómo verlo" className="inline-flex rounded-full border border-line bg-surface p-1">
          {viewLink("mes", "Mes", CalendarDays)}
          {viewLink("semana", "Semana", CalendarRange)}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filtrar por categoría"
          value={state.category ?? ""}
          onChange={(event) => apply({ category: (event.target.value || null) as EventCategory | null })}
          className={filterSelectClass}
        >
          <option value="">Todas las categorías</option>
          {EVENT_CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por tipo"
          value={state.type ?? ""}
          onChange={(event) => apply({ type: (event.target.value || null) as CalendarType | null })}
          className={filterSelectClass}
        >
          <option value="">Eventos, tareas y publicaciones</option>
          {CALENDAR_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              Solo {option.label.toLowerCase()}
            </option>
          ))}
        </select>

        {hasCalendarFilters(state) && (
          <Link
            href={href({ ...state, category: null, type: null })}
            className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-bordo hover:bg-bordo-soft"
          >
            <X className="size-4" aria-hidden />
            Limpiar filtros
          </Link>
        )}
      </div>
    </div>
  );
}
