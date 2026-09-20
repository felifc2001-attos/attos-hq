"use client";

import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { moveIssue } from "@/lib/issues/actions";
import { ISSUE_DONE_DAYS, ISSUE_STATUSES } from "@/lib/issues/constants";
import type { IssueItem } from "@/lib/issues/types";
import { IssueCard } from "./issue-card";

/** El recorrido de los problemas y mejoras, de reportado a en producción. */
export function IssueBoard({ issues }: { issues: IssueItem[] }) {
  return (
    <PipelineBoard
      id="issues-pipeline"
      columns={ISSUE_STATUSES}
      items={issues}
      onMove={moveIssue}
      renderCard={(issue) => <IssueCard issue={issue} />}
      describeItem={(issue) => `el problema ${issue.title}`}
      emptyText="Soltá un problema acá"
      hint={
        <>
          Arrastrá las tarjetas entre columnas. Al llegar a “En producción” se le avisa a quien lo reportó; ahí se ve lo de
          los últimos {ISSUE_DONE_DAYS} días.
        </>
      }
    />
  );
}
