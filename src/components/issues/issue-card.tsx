"use client";

import { Inbox } from "lucide-react";
import { PersonAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { dateInAR, formatShortDate } from "@/lib/dates";
import { ISSUE_CATEGORY_TONES } from "@/lib/issues/constants";
import type { IssueItem } from "@/lib/issues/types";
import { ISSUE_CATEGORIES } from "@/lib/quick-create/constants";
import { PRIORITIES, findOption } from "@/lib/tasks/constants";
import { useIssueDialog } from "./issue-dialog";

/** El contenido de una tarjeta del tablero de Sistemas. */
export function IssueCard({ issue }: { issue: IssueItem }) {
  const { open } = useIssueDialog();
  const priority = findOption(PRIORITIES, issue.priority);
  const category = ISSUE_CATEGORIES.find((option) => option.value === issue.category);
  const resolved = issue.status === "produccion";

  return (
    <div>
      <button
        type="button"
        onClick={() => open(issue)}
        className="block w-full text-left text-sm font-semibold leading-snug text-ink transition hover:text-bordo"
      >
        {issue.title}
      </button>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge tone={ISSUE_CATEGORY_TONES[issue.category]}>{category?.label ?? issue.category}</Badge>
        {!resolved && <Badge tone={priority.tone}>{priority.label}</Badge>}
      </div>

      <p className="mt-2.5 text-xs text-muted">
        {resolved && issue.resolvedAt
          ? `Resuelto el ${formatShortDate(dateInAR(issue.resolvedAt))}`
          : `${issue.reporter ? `Lo reportó ${issue.reporter.fullName}` : "Reportado"} · ${formatShortDate(dateInAR(issue.createdAt))}`}
      </p>

      <div className="mt-3 flex items-center justify-end">
        {issue.assignee ? (
          <PersonAvatar person={issue.assignee} size="sm" />
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-2.5 py-1 text-xs font-medium text-muted">
            <Inbox className="size-3.5" aria-hidden />
            Bandeja
          </span>
        )}
      </div>
    </div>
  );
}
