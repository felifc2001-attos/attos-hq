"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useContentDialog } from "@/components/content/content-dialog";
import { useIdeaDialog } from "@/components/ideas/idea-dialog";
import { useIssueDialog } from "@/components/issues/issue-dialog";
import { useRequestDialog } from "@/components/requests/request-dialog";
import { useTaskDialog } from "@/components/tasks/task-dialog";
import type { ContentItem } from "@/lib/content/types";
import type { RequestItem } from "@/lib/dependencies/types";
import type { IdeaItem } from "@/lib/ideas/types";
import type { IssueItem } from "@/lib/issues/types";
import type { Task } from "@/lib/tasks/types";

type DeepLinkProps = { cleanHref: string } & (
  | { task: Task }
  | { idea: IdeaItem }
  | { request: RequestItem }
  | { content: ContentItem }
  | { issue: IssueItem }
);

// Abre una tarea, idea, pedido, publicación o problema al llegar a una pantalla con un enlace directo
// (por ejemplo, desde una notificación: /tareas?tarea=<id>). Después limpia la dirección,
// así al recargar la página no se vuelve a abrir.
export function DeepLink(props: DeepLinkProps) {
  const router = useRouter();
  const { openEdit: openTask } = useTaskDialog();
  const { open: openIdea } = useIdeaDialog();
  const { open: openRequest } = useRequestDialog();
  const { open: openContent } = useContentDialog();
  const { open: openIssue } = useIssueDialog();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return; // el modo estricto de desarrollo ejecuta los efectos dos veces
    opened.current = true;

    if ("task" in props) openTask(props.task);
    else if ("idea" in props) openIdea(props.idea);
    else if ("request" in props) openRequest(props.request);
    else if ("content" in props) openContent(props.content);
    else openIssue(props.issue);

    router.replace(props.cleanHref, { scroll: false });
  }, [props, router, openTask, openIdea, openRequest, openContent, openIssue]);

  return null;
}
