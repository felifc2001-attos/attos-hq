import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

// Corre en cada visita (lo llama src/proxy.ts):
//  1. Renueva la sesión si está por vencer y guarda las cookies nuevas.
//  2. Manda a /login a quien no inició sesión, y al inicio a quien ya la tiene y abre /login.
// Es una revisión rápida "optimista": la verificación fuerte está en getCurrentUser()
// y en la seguridad de la base (RLS).
export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Evita que un CDN guarde en caché una respuesta con la sesión de alguien.
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // getClaims() valida la firma del token sin ir a la red en cada visita.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) return redirectTo(request, "/login", response);
  if (isLoggedIn && isLoginPage) return redirectTo(request, "/", response);

  return response;
}

// Al redirigir hay que conservar las cookies y cabeceras que pudo haber renovado Supabase.
function redirectTo(request: NextRequest, pathname: string, from: NextResponse) {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  from.headers.forEach((value, name) => {
    if (/^(cache-control|expires|pragma)$/i.test(name)) redirect.headers.set(name, value);
  });
  return redirect;
}
