"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { parseMutedTypes } from "@/lib/notifications/preferences";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/tasks/types";
import { checkNewPassword, parseProfileInput } from "./validate";

// Tu perfil, tu contraseña y tus preferencias de notificaciones: cada persona toca solo lo suyo.

const SAVE_ERROR = "No se pudo guardar. Probá de nuevo en unos segundos.";

function fail(error: string, detail?: string): ActionResult {
  if (detail) console.error(`[perfil] ${error} — ${detail}`);
  return { ok: false, error };
}

export async function updateProfile(raw: unknown): Promise<ActionResult> {
  const parsed = parseProfileInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      area: input.area || null,
      default_area: input.defaultArea,
      color: input.color,
    })
    .eq("id", me.id);
  if (error) return fail(SAVE_ERROR, error.message);

  // Nombre y color se ven en todas las pantallas (avatares, tareas, calendario…).
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(password: unknown, confirmation: unknown): Promise<ActionResult> {
  const problem = checkNewPassword(password, confirmation);
  if (problem) return fail(problem);

  await getCurrentUser(); // verifica que haya sesión
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: password as string });
  if (error) {
    switch (error.code) {
      case "same_password":
        return fail("Elegí una contraseña distinta de la actual.");
      case "weak_password":
        return fail("Esa contraseña es muy fácil de adivinar. Probá con una más larga o más variada.");
      case "reauthentication_needed":
        return fail("Por seguridad, cerrá sesión, volvé a entrar y probá de nuevo.");
      default:
        return fail("No se pudo cambiar la contraseña. Probá de nuevo en unos segundos.", `${error.code}: ${error.message}`);
    }
  }
  return { ok: true };
}

/** `muted`: los tipos de aviso que NO querés recibir. */
export async function updateNotificationPreferences(muted: unknown): Promise<ActionResult> {
  const parsed = parseMutedTypes(muted);
  if (!parsed.ok) return fail(parsed.error);

  const me = await getCurrentUser();
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ muted_notification_types: parsed.value }).eq("id", me.id);
  if (error) {
    // 42703 = la columna no existe todavía.
    if (error.code === "42703") return fail("Falta ejecutar el archivo de la Etapa 9 en Supabase para guardar esto.");
    return fail(SAVE_ERROR, error.message);
  }

  revalidatePath("/configuracion");
  return { ok: true };
}
