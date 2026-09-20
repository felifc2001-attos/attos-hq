"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { filterSelectClass } from "@/components/ui/form-controls";
import {
  IDEA_ORDERS,
  IDEA_STATES,
  hasActiveIdeaFilters,
  ideaFiltersToQuery,
  type IdeaFilters,
  type IdeaOrder,
} from "@/lib/ideas/filters";
import { AREAS, type Area } from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";

const BASE_PATH = "/ideas";

export function IdeaFilterBar({ filters }: { filters: IdeaFilters }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(patch: Partial<IdeaFilters>) {
    startTransition(() => router.replace(`${BASE_PATH}${ideaFiltersToQuery({ ...filters, ...patch })}`));
  }

  return (
    <div className={cn("mb-6 flex flex-wrap items-center gap-3 transition-opacity", pending && "opacity-60")}>
      <nav aria-label="Qué ideas ver" className="inline-flex rounded-full border border-line bg-surface p-1">
        {IDEA_STATES.map((state) => (
          <Link
            key={state.value}
            href={`${BASE_PATH}${ideaFiltersToQuery({ ...filters, state: state.value })}`}
            aria-current={filters.state === state.value ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              filters.state === state.value ? "bg-bordo text-beige shadow-card" : "text-muted hover:text-ink",
            )}
          >
            {state.label}
          </Link>
        ))}
      </nav>

      <select
        aria-label="Ordenar ideas"
        value={filters.order}
        onChange={(event) => apply({ order: event.target.value as IdeaOrder })}
        className={filterSelectClass}
      >
        {IDEA_ORDERS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por área"
        value={filters.area ?? ""}
        onChange={(event) => apply({ area: (event.target.value || null) as Area | null })}
        className={filterSelectClass}
      >
        <option value="">Todas las áreas</option>
        {AREAS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasActiveIdeaFilters(filters) && (
        <Link
          href={BASE_PATH}
          className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-bordo hover:bg-bordo-soft"
        >
          <X className="size-4" aria-hidden />
          Limpiar filtros
        </Link>
      )}
    </div>
  );
}
