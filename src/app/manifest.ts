import type { MetadataRoute } from "next";

// Permite "instalar" ATTOS HQ en el celular o la compu (Agregar a la pantalla de inicio): se abre como una app, sin la barra del navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ATTOS HQ",
    short_name: "ATTOS HQ",
    description: "El centro operativo interno del equipo ATTOS.",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4ede3",
    theme_color: "#631636",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
