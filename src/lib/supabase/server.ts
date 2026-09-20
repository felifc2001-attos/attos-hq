import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

// Cliente para usar desde el servidor (Server Components, acciones y rutas).
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Desde un Server Component no se pueden escribir cookies:
          // el refresco de la sesión lo hace el proxy (se agrega en la Etapa 1).
        }
      },
    },
  });
}
