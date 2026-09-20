import { asRecord, fail, isError, readOption, readText, type Parsed } from "../quick-create/validate";
import { AREAS, type Area } from "../tasks/constants";

/** Los colores con los que se identifica cada persona (avatar, calendario, tareas…). Todos se leen bien con letra blanca. */
export const PROFILE_COLORS = [
  { value: "#631636", label: "Bordó" },
  { value: "#d9694a", label: "Coral" },
  { value: "#6d5bb5", label: "Violeta" },
  { value: "#2f7d8a", label: "Verde azulado" },
  { value: "#a8842f", label: "Ocre" },
  { value: "#3f8f5f", label: "Verde" },
  { value: "#3f6fb0", label: "Azul" },
  { value: "#b03f7d", label: "Frambuesa" },
] as const;

export interface ProfileInput {
  fullName: string;
  /** El texto que ven los demás ("Comercial & Operaciones"); vacío si no se completa. */
  area: string;
  /** El área que se sugiere al crear tareas. */
  defaultArea: Area | null;
  /** Hexadecimal en minúsculas ("#631636"). */
  color: string;
}

export const NAME_MAX = 60;
export const AREA_TEXT_MAX = 80;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Revisa lo que llega del formulario de perfil; se hace en el servidor porque nadie garantiza que la llamada venga de nuestro formulario. */
export function parseProfileInput(raw: unknown): Parsed<ProfileInput> {
  const input = asRecord(raw);
  if (!input) return fail("Datos inválidos.");

  const fullName = readText(input.fullName, "tu nombre", NAME_MAX, true);
  if (isError(fullName)) return fail(fullName.error);
  const area = readText(input.area, "el área", AREA_TEXT_MAX, false);
  if (isError(area)) return fail(area.error);

  let defaultArea: Area | null = null;
  if (input.defaultArea !== null && input.defaultArea !== undefined && input.defaultArea !== "") {
    defaultArea = readOption(AREAS, input.defaultArea);
    if (!defaultArea) return fail("El área de trabajo elegida no es válida.");
  }

  const color = typeof input.color === "string" ? input.color.trim() : "";
  if (!HEX_COLOR.test(color)) return fail("El color elegido no es válido.");

  return { ok: true, value: { fullName, area, defaultArea, color: color.toLowerCase() } };
}

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

/** Revisa una contraseña nueva y su repetición. Devuelve el mensaje de error, o null si está bien. */
export function checkNewPassword(password: unknown, confirmation: unknown): string | null {
  if (typeof password !== "string" || typeof confirmation !== "string") return "Datos inválidos.";
  if (password.length < PASSWORD_MIN) return `La contraseña tiene que tener al menos ${PASSWORD_MIN} caracteres.`;
  if (password.length > PASSWORD_MAX) return `La contraseña es muy larga (máximo ${PASSWORD_MAX} caracteres).`;
  if (password !== confirmation) return "Las dos contraseñas no coinciden.";
  return null;
}
