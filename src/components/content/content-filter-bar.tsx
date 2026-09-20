"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { filterSelectClass } from "@/components/ui/form-controls";
import { CONTENT_FORMATS, type ContentFormat } from "@/lib/content/constants";
import { contentFiltersToQuery, hasActiveContentFilters, type ContentFilters } from "@/lib/content/filters";
import type { PersonOption, ProjectOption } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const BASE_PATH = "/contenido";

interface ContentFilterBarProps {
  filters: ContentFilters;
  people: PersonOption[];
  projects: ProjectOption[];
}

export function ContentFilterBar({ filters, people, projects }: ContentFilterBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(patch: Partial<ContentFilters>) {
    startTransition(() => router.replace(`${BASE_PATH}${contentFiltersToQuery({ ...filters, ...patch })}`));
  }

  return (
    <div className={cn("mb-5 flex flex-wrap items-center gap-2 transition-opacity", pending && "opacity-60")}>
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

      <select
        aria-label="Filtrar por formato"
        value={filters.format ?? ""}
        onChange={(event) => apply({ format: (event.target.value || null) as ContentFormat | null })}
        className={filterSelectClass}
      >
        <option value="">Todos los formatos</option>
        {CONTENT_FORMATS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

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

      {hasActiveContentFilters(filters) && (
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
