import { fail, parseIssueInput, readOption, type Parsed } from "../quick-create/validate";
import { ISSUE_STATUSES } from "./constants";
import type { IssueEditInput } from "./types";

/** Revisa lo que llega del formulario al editar un problema: lo mismo que al reportarlo, más el estado. */
export function parseIssueEditInput(raw: unknown): Parsed<IssueEditInput> {
  const base = parseIssueInput(raw);
  if (!base.ok) return base;

  const status = readOption(ISSUE_STATUSES, (raw as Record<string, unknown>).status);
  if (!status) return fail("El estado elegido no es válido.");

  return { ok: true, value: { ...base.value, status } };
}
