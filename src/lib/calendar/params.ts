// Lo que se elige en la pantalla del Calendario vive en la dirección: ?vista=semana&fecha=2026-09-21&categoria=marketing

import { isValidISODate } from "../dates";
import { EVENT_CATEGORIES, type EventCategory } from "../quick-create/constants";
import { CALENDAR_TYPES, type CalendarType } from "./items";
import { startOfMonth, type CalendarView } from "./range";

export interface CalendarState {
  view: CalendarView;
  /** Cualquier día del mes o de la semana que se está mirando. */
  date: string;
  category: EventCategory | null;
  type: CalendarType | null;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Lee la dirección. Todo lo que no sea un valor válido se ignora; sin fecha se muestra el día de hoy. */
export function parseCalendarParams(params: RawParams, today: string): CalendarState {
  const date = first(params.fecha);
  return {
    view: first(params.vista) === "semana" ? "semana" : "mes",
    date: date && isValidISODate(date) ? date : today,
    category: EVENT_CATEGORIES.find((option) => option.value === first(params.categoria))?.value ?? null,
    type: CALENDAR_TYPES.find((option) => option.value === first(params.tipo))?.value ?? null,
  };
}

/** Arma la parte "?vista=semana&..." de la dirección; lo que está en su valor por defecto se omite. */
export function calendarQuery(state: CalendarState, today: string): string {
  const params = new URLSearchParams();
  if (state.view === "semana") params.set("vista", "semana");
  if (state.date !== today) params.set("fecha", state.date);
  if (state.category) params.set("categoria", state.category);
  if (state.type) params.set("tipo", state.type);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Cambiar de mes a semana lleva a la semana de hoy si hoy está en el mes que se miraba. */
export function withView(state: CalendarState, view: CalendarView, today: string): CalendarState {
  if (view === state.view) return state;
  const date = view === "semana" && startOfMonth(today) === startOfMonth(state.date) ? today : state.date;
  return { ...state, view, date };
}

export function hasCalendarFilters(state: CalendarState): boolean {
  return state.category !== null || state.type !== null;
}
