import Link from "next/link";
import { PersonAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatShortDate } from "@/lib/dates";
import type { ProjectSummary } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { ProjectStatusBadge } from "./status-badge";

const MAX_AVATARS = 4;

export function ProjectCard({ project, today }: { project: ProjectSummary; today: string }) {
  const late = project.status !== "finalizado" && project.targetDate !== null && project.targetDate < today;
  const shown = project.members.slice(0, MAX_AVATARS);
  const hidden = project.members.length - shown.length;

  return (
    <Link
      href={`/proyectos/${project.id}`}
      className="block rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bordo"
    >
      <Card interactive className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 font-display text-xl font-semibold leading-snug text-ink">{project.name}</h2>
          <ProjectStatusBadge status={project.status} />
        </div>

        {project.description && <p className="line-clamp-2 text-sm text-muted">{project.description}</p>}

        <div className="mt-auto">
          <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
            <span className="text-muted">
              {project.taskCount === 0
                ? "Todavía sin tareas"
                : `${project.doneCount} de ${project.taskCount} ${project.taskCount === 1 ? "tarea" : "tareas"}`}
            </span>
            <span className="font-semibold text-bordo">{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} label={`Progreso de ${project.name}`} />
        </div>

        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center -space-x-2" aria-label={`Participan: ${project.members.map((m) => m.fullName).join(", ")}`}>
            {shown.map((person) => (
              <PersonAvatar key={person.id} person={person} size="sm" />
            ))}
            {hidden > 0 && (
              <span className="z-10 inline-flex size-8 items-center justify-center rounded-full bg-beige-deep text-xs font-semibold text-muted ring-2 ring-surface">
                +{hidden}
              </span>
            )}
          </div>
          {project.targetDate && (
            <span className={cn("font-semibold", late ? "text-prio-urgent" : "text-muted")}>
              {late ? "Vencía el" : "Objetivo:"} {formatShortDate(project.targetDate)}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
