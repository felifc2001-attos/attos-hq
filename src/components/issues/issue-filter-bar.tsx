"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { filterSelectClass } from "@/components/ui/form-controls";
import {
  DEFAULT_ISSUE_FILTERS,
  ISSUE_VIEWS,
  hasActiveIssueFilters,
  issueFiltersToQuery,
  type IssueFilters,
} from "@/lib/issues/filters";
import { ISSUE_CATEGORIES, type IssueCategory } from "@/lib/quick-create/constants";
import { PRIORITIES, type Priority } from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";

const BASE_PATH = "/sistemas";

interface IssueFilterBarProps {
  filters: IssueFilters;
  /** Cuántos problemas hay en cada pestaña (con los filtros de tipo y prioridad aplicados). */
  counts: Record<IssueFilters["view"], number>;
}

export function IssueFilterBar({ filters, counts }: IssueFilterBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(patch: Partial<IssueFilters>) {
    startTransition(() => router.replace(`${BASE_PATH}${issueFiltersToQuery({ ...filters, ...patch })}`));
  }

  return (
    <div className={cn("mb-5 space-y-3 transition-opacity", pending && "opacity-60")}>
      <nav aria-label="Qué problemas ver" className="inline-flex max-w-full flex-wrap rounded-full border border-line bg-surface p-1">
        {ISSUE_VIEWS.map((option) => (
          <Link
            key={option.value}
            href={`${BASE_PATH}${issueFiltersToQuery({ ...filters, view: option.value })}`}
            aria-current={filters.view === option.value ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              filters.view === option.value ? "bg-bordo text-beige shadow-card" : "text-muted hover:text-ink",
            )}
          >
            {option.label} ({counts[option.value]})
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filtrar por tipo"
          value={filters.category ?? ""}
          onChange={(event) => apply({ category: (event.target.value || null) as IssueCategory | null })}
          className={filterSelectClass}
        >
          <option value="">Todos los tipos</option>
          {ISSUE_CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por prioridad"
          value={filters.priority ?? ""}
          onChange={(event) => apply({ priority: (event.target.value || null) as Priority | null })}
          className={filterSelectClass}
        >
          <option value="">Todas las prioridades</option>
          {PRIORITIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasActiveIssueFilters(filters) && (
          <Link
            href={`${BASE_PATH}${issueFiltersToQuery({ ...DEFAULT_ISSUE_FILTERS, view: filters.view })}`}
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
