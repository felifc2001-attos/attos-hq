import { CalendarDays, Megaphone, SquareCheckBig, type LucideIcon } from "lucide-react";
import type { CalendarKind } from "@/lib/calendar/types";
import type { EventCategory } from "@/lib/quick-create/constants";

// Los nombres de clase van completos (no armados con texto) para que Tailwind los encuentre.
interface CategoryStyle {
  label: string;
  /** Franja de color a la izquierda y fondo suave de cada elemento. */
  chip: string;
  dot: string;
}

export const CATEGORY_STYLES: Record<EventCategory, CategoryStyle> = {
  comercial: { label: "Comercial", chip: "border-cat-comercial bg-cat-comercial/10", dot: "bg-cat-comercial" },
  marketing: { label: "Marketing", chip: "border-cat-marketing bg-cat-marketing/12", dot: "bg-cat-marketing" },
  sistemas: { label: "Sistemas", chip: "border-cat-sistemas bg-cat-sistemas/10", dot: "bg-cat-sistemas" },
  operaciones: { label: "Operaciones", chip: "border-cat-operaciones bg-cat-operaciones/10", dot: "bg-cat-operaciones" },
  reuniones: { label: "Reuniones", chip: "border-cat-reuniones bg-cat-reuniones/12", dot: "bg-cat-reuniones" },
};

/** Las tareas sin área no tienen categoría. */
export const NEUTRAL_STYLE: CategoryStyle = {
  label: "Sin categoría",
  chip: "border-muted bg-beige-deep/50",
  dot: "bg-muted",
};

export const styleFor = (category: EventCategory | null): CategoryStyle =>
  category ? CATEGORY_STYLES[category] : NEUTRAL_STYLE;

export const KIND_ICONS: Record<CalendarKind, LucideIcon> = {
  event: CalendarDays,
  task: SquareCheckBig,
  content: Megaphone,
};
