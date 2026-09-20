import type { NextConfig } from "next";

// Cabeceras de seguridad para todas las páginas. No se incluye una política de contenido (CSP): hay que
// contemplar los scripts propios de Next y la conexión en vivo con Supabase, y una mal armada rompe la app.
const securityHeaders = [
  // Nadie puede mostrar ATTOS HQ dentro de otra página (evita el "clickjacking").
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al salir hacia otro sitio no se manda la dirección completa (puede llevar ids).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Es una app interna: que ningún buscador la indexe, aunque alguien encuentre la dirección.
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
