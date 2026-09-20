import { CONTENT_STATUSES, labelOf } from "../content/constants";
import { ISSUE_STATUSES } from "../issues/constants";
import { PROJECT_STATUSES } from "../quick-create/constants";
import { STATUSES } from "../tasks/constants";
import type { SearchKind } from "./types";

/** El estado de un resultado, con su nombre ("en_curso" → "En curso"); vacío si ese tipo no tiene. */
export function hitStatusLabel(kind: SearchKind, status: string | null): string {
  if (!status) return "";
  switch (kind) {
    case "task":
      return labelOf(STATUSES, status);
    case "project":
      return labelOf(PROJECT_STATUSES, status);
    case "content_item":
      return labelOf(CONTENT_STATUSES, status);
    case "system_issue":
      return labelOf(ISSUE_STATUSES, status);
    default:
      return "";
  }
}
