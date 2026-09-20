"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Columns3, List, X, type LucideIcon } from "lucide-react";
import { filterSelectClass } from "@/components/ui/form-controls";
import { AREAS, PRIORITIES, STATUSES, type Area, type Priority, type TaskStatus } from "@/lib/tasks/constants";
import {
  DEFAULT_FILTERS,
  DUE_FILTERS,
  filtersToQuery,
  hasActiveFilters,
  type DueFilter,
  type TaskFilters,
} from "@/lib/tasks/filters";
import type { PersonOption, ProjectOption } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface TaskFilterBarProps {
  filters: TaskFilters;
  people: PersonOption[];
  projects: ProjectOption[];
}

const BASE_PATH = "/tareas";

export function TaskFilterBar({ filters, people, projects }: TaskFilterBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(patch: Partial<TaskFilters>) {
    startTransition(() => router.replace(`${BASE_PATH}${filtersToQuery({ ...filters, ...patch })}`));
  }

  const tab = (scope: TaskFilters["scope"], label: string) => (
    <Link
      href={`${BASE_PATH}${filtersToQuery({ ...filters, scope, person: null })}`}
      aria-current={filters.scope === scope ? "page" : undefined}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-semibold transition",
        filters.scope === scope ? "bg-bordo text-beige shadow-card" : "text-muted hover:text-ink",
      )}
    >
      {label}
    </Link>
  );

  const viewLink = (view: TaskFilters["view"], label: string, Icon: LucideIcon) => (
    <Link
      // Al pasar al Kanban se descartan "estado" y "ver completadas": el tablero ya muestra todos los estados.
      href={`${BASE_PATH}${filtersToQuery({ ...filters, view, status: null, showDone: false })}`}
      aria-current={filters.view === view ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
        filters.view === view ? "bg-bordo text-beige shadow-card" : "text-muted hover:text-ink",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );

  return (
    <div className={cn("mb-5 space-y-3 transition-opacity", pending && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Qué tareas ver" className="inline-flex rounded-full border border-line bg-surface p-1">
          {tab("mias", "Mis tareas")}
          {tab("todas", "Todas las tareas")}
        </nav>
        <nav aria-label="Cómo verlas" className="inline-flex rounded-full border border-line bg-surface p-1">
          {viewLink("lista", "Lista", List)}
          {viewLink("kanban", "Kanban", Columns3)}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.scope === "todas" && (
          <select
            aria-label="Filtrar por persona"
            value={filters.person ?? ""}
            onChange={(event) => apply({ person: event.target.value || null })}
            className={filterSelectClass}
          >
            <option value="">Todas las personas</option>
            <option value="sin_asignar">Sin asignar</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </select>
        )}

        <select
          aria-label="Filtrar por proyecto"
          value={filters.project ?? ""}
          onChange={(event) => apply({ project: event.target.value || null })}
          className={filterSelectClass}
        >
          <option value="">Todos los proyectos</option>
          <option value="sin_proyecto">Sin proyecto</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
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

        {filters.view === "lista" && (
          <select
            aria-label="Filtrar por estado"
            value={filters.status ?? ""}
            onChange={(event) => apply({ status: (event.target.value || null) as TaskStatus | null })}
            className={filterSelectClass}
          >
            <option value="">Todos los estados</option>
            {STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

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

        <select
          aria-label="Filtrar por fecha"
          value={filters.due ?? ""}
          onChange={(event) => apply({ due: (event.target.value || null) as DueFilter | null })}
          className={filterSelectClass}
        >
          <option value="">Cualquier fecha</option>
          {DUE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {filters.view === "lista" && !filters.status && (
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-2 text-sm font-medium text-muted hover:text-ink">
            <input
              type="checkbox"
              checked={filters.showDone}
              onChange={(event) => apply({ showDone: event.target.checked })}
              className="size-4 accent-bordo"
            />
            Ver completadas
          </label>
        )}

        {hasActiveFilters(filters) && (
          <Link
            href={`${BASE_PATH}${filtersToQuery({ ...DEFAULT_FILTERS, scope: filters.scope, view: filters.view })}`}
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
