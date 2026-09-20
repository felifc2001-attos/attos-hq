import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  area: string;
  initials: string;
  /** Color identificador en hexadecimal (viene de la tabla profiles). */
  color: string;
}

// Devuelve a la persona que inició sesión, o la manda a /login.
// A diferencia del proxy, acá se le pregunta a Supabase si la sesión es válida (getUser()).
// `cache` evita repetir la consulta dentro de una misma visita.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, area, color, is_active")
    .eq("id", user.id)
    .single();

  // Cuenta desactivada (o sin perfil): se cierra la sesión y se vuelve al login.
  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return {
    id: user.id,
    email: user.email ?? "",
    name: profile.full_name,
    area: profile.area ?? "",
    initials: profile.full_name.trim().charAt(0).toUpperCase(),
    color: profile.color,
  };
});
