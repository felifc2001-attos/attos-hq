import type { MetadataRoute } from "next";

// ATTOS HQ es una herramienta interna: no debe aparecer en ningún buscador.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
