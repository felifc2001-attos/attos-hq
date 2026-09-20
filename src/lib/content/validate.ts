import { arToISO } from "../dates";
import {
  TIME,
  asRecord,
  fail,
  isError,
  readDate,
  readId,
  readOption,
  readText,
  type Parsed,
} from "../quick-create/validate";
import { CONTENT_FORMATS, CONTENT_STATUSES } from "./constants";
import type { ContentInput } from "./types";

const TITLE_MAX = 200;
const LONG_MAX = 5000;
const LINK_MAX = 500;
const MAX_LINKS = 20;
/** Hora que se toma si se elige un día de publicación pero no una hora. */
export const DEFAULT_PUBLISH_TIME = "12:00";

function isWebLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Revisa lo que llega del formulario de contenido; se hace en el servidor porque nadie garantiza que la llamada venga de nuestro formulario. */
export function parseContentInput(raw: unknown): Parsed<ContentInput> {
  const input = asRecord(raw);
  if (!input) return fail("Datos inválidos.");

  const title = readText(input.title, "el título", TITLE_MAX, true);
  if (isError(title)) return fail(title.error);
  const copy = readText(input.copy, "el texto", LONG_MAX, false);
  if (isError(copy)) return fail(copy.error);

  const format = readOption(CONTENT_FORMATS, input.format);
  if (!format) return fail("El formato elegido no es válido.");
  const status = readOption(CONTENT_STATUSES, input.status);
  if (!status) return fail("El estado elegido no es válido.");
  const assigneeId = readId(input.assigneeId);
  if (assigneeId === undefined) return fail("La persona elegida no es válida.");
  const projectId = readId(input.projectId);
  if (projectId === undefined) return fail("El proyecto elegido no es válido.");

  const date = readDate(input.publishDate);
  if (date === undefined) return fail("La fecha de publicación no es válida.");
  const time = input.publishTime === null || input.publishTime === undefined || input.publishTime === "" ? null : input.publishTime;
  if (time !== null && (typeof time !== "string" || !TIME.test(time))) return fail("La hora de publicación no es válida.");
  if (time !== null && date === null) return fail("Elegí también el día de publicación.");
  const publishAt = date ? arToISO(date, time ?? DEFAULT_PUBLISH_TIME) : null;

  const rawLinks = Array.isArray(input.links) ? input.links : [];
  const links: string[] = [];
  for (const entry of rawLinks) {
    const link = typeof entry === "string" ? entry.trim() : "";
    if (!link) continue;
    if (link.length > LINK_MAX) return fail("Uno de los enlaces es muy largo.");
    if (!isWebLink(link)) return fail(`El enlace “${link}” no es válido: tiene que empezar con http:// o https://.`);
    if (!links.includes(link)) links.push(link);
  }
  if (links.length > MAX_LINKS) return fail(`Como máximo ${MAX_LINKS} enlaces.`);

  return { ok: true, value: { title, format, status, assigneeId, projectId, publishAt, copy, links } };
}

/** Una nota opcional al pedir cambios. */
export function parseReviewNote(raw: unknown): Parsed<string> {
  const note = readText(raw, "la nota", 1000, false);
  return isError(note) ? fail(note.error) : { ok: true, value: note };
}
