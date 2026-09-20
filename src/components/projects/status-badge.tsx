import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/quick-create/constants";

const TONES: Record<ProjectStatus, BadgeTone> = {
  idea: "neutral",
  planificando: "review",
  en_curso: "doing",
  pausado: "todo",
  finalizado: "done",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const label = PROJECT_STATUSES.find((option) => option.value === status)?.label ?? status;
  return <Badge tone={TONES[status]}>{label}</Badge>;
}
