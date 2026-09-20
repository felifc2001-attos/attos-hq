import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Todas las rutas menos archivos internos de Next, imágenes de /public y los archivos que el navegador pide sin sesión
  // (robots.txt y el manifest de la app instalable: si se los redirigiera a /login, dejarían de funcionar).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|manifest\\.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
