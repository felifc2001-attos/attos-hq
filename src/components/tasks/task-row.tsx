"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Check, FolderKanban, Lock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge, BADGE_TONES } from "@/components/ui/badge";
import { formatDueLabel } from "@/lib/dates";
import { setTaskStatus } from "@/lib/tasks/actions";
import { PRIORITIES, STATUSES, findOption, type TaskStatus } from "@/lib/tasks/constants";
import type { Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { useTaskDialog } from "./task-dialog";

interface TaskRowProps {
  task: Task;
  /** El día de hoy (YYYY-MM-DD), calculado en el servidor para que no varíe entre servidor y navegador. */
  today: string;
  /** Mostrar quién tiene asignada la tarea (en Mi día, por ejemplo, es siempre la misma persona). */
  showAssignee?: boolean;
}

export function TaskRow({ task, today, showAssignee = true }: TaskRowProps) {
  const { openEdit } = useTaskDialog();
  const [status, setStatus] = useOptimistic<TaskStatus, TaskStatus>(task.status, (_current, next) => next);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const done = status === "listo";
  const priority = findOption(PRIORITIES, task.priority);
  const overdue = !done && task.dueDate !== null && task.dueDate < today;

  // Se marca al instante; si el servidor falla, vuelve solo al estado anterior y se avisa.
  function changeStatus(next: TaskStatus) {
    setError(null);
    startTransition(async () => {
      setStatus(next);
      const result = await setTaskStatus(task.id, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <li className="flex flex-wrap items-start gap-x-3 gap-y-2 px-4 py-3.5 sm:px-5">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Marcar "${task.title}" como pendiente` : `Completar "${task.title}"`}
        onClick={() => changeStatus(done ? "por_hacer" : "listo")}
        className={cn(
          "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90",
          done
            ? "border-st-done bg-st-done text-white"
            : "border-line bg-surface text-transparent hover:border-st-done hover:text-st-done/50",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </button>

      <div className="min-w-0 flex-1 basis-56">
        <button
          type="button"
          onClick={() => openEdit(task)}
          className={cn(
            "block max-w-full text-left text-[0.95rem] font-semibold leading-snug transition hover:text-bordo",
            done ? "text-muted line-through" : "text-ink",
          )}
        >
          {task.title}
        </button>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {task.dueDate && (
            <span
              className={cn(
                "font-semibold",
                overdue ? "text-prio-urgent" : task.dueDate === today && !done ? "text-bordo" : "",
              )}
            >
              {formatDueLabel(task.dueDate, today)}
            </span>
          )}
          {task.project && (
            <Link href={`/proyectos/${task.project.id}`} className="inline-flex items-center gap-1 transition hover:text-bordo">
              <FolderKanban className="size-3.5" aria-hidden />
              {task.project.name}
            </Link>
          )}
          {task.labels.map((label) => (
            <span key={label.id} className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full" style={{ backgroundColor: label.color }} aria-hidden />
              {label.name}
            </span>
          ))}
        </div>

        {task.blockedBy.length > 0 && !done && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-prio-high">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Esperando a {task.blockedBy.map((item) => `${item.providerName}: ${item.title}`).join(" · ")}
            </span>
          </p>
        )}

        {error && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-prio-urgent">
            {error}
          </p>
        )}
      </div>

      <div className="ml-9 flex shrink-0 items-center gap-2 sm:ml-0">
        <Badge tone={priority.tone}>{priority.label}</Badge>
        <select
          value={status}
          onChange={(event) => changeStatus(event.target.value as TaskStatus)}
          aria-label={`Estado de "${task.title}"`}
          className={cn(
            "cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-bordo",
            BADGE_TONES[findOption(STATUSES, status).tone],
          )}
        >
          {STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {showAssignee &&
          (task.assignee ? (
            <Avatar
              size="sm"
              member={{
                name: task.assignee.fullName,
                initials: task.assignee.fullName.charAt(0).toUpperCase(),
                color: task.assignee.color,
              }}
            />
          ) : (
            <span className="inline-flex size-8 items-center justify-center rounded-full border border-dashed border-line text-xs text-muted" title="Sin asignar">
              ?
            </span>
          ))}
      </div>
    </li>
  );
}
