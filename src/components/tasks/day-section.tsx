import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { TaskRow } from "./task-row";

interface DaySectionProps {
  title: string;
  hint?: string;
  icon: LucideIcon;
  /** Clases del cuadradito del ícono (fondo suave + color). */
  iconClassName: string;
  tasks: Task[];
  today: string;
  showAssignee?: boolean;
}

// Una sección de "Mi día". Si no hay tareas no se dibuja, para que la pantalla muestre solo lo que importa.
export function DaySection({
  title,
  hint,
  icon: Icon,
  iconClassName,
  tasks,
  today,
  showAssignee = false,
}: DaySectionProps) {
  if (tasks.length === 0) return null;

  return (
    <section aria-labelledby={`day-${title}`}>
      <div className="mb-3 flex items-center gap-3">
        <span className={cn("inline-flex size-9 items-center justify-center rounded-xl", iconClassName)}>
          <Icon className="size-[1.15rem]" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id={`day-${title}`} className="font-display text-lg font-semibold leading-tight text-ink">
            {title}
          </h2>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        <Badge className="ml-auto">{tasks.length}</Badge>
      </div>
      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-line">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} today={today} showAssignee={showAssignee} />
          ))}
        </ul>
      </Card>
    </section>
  );
}
