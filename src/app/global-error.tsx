"use client";

import "./globals.css";

// Último recurso: se muestra si falla algo tan de fondo que ni siquiera se puede armar el menú de la app.
// Reemplaza a todo el documento, por eso lleva su propio <html> y <body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-AR">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-beige px-4 text-center text-ink">
        <title>Algo salió mal · ATTOS HQ</title>
        <h1 className="text-2xl font-semibold">Algo salió mal</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          No pudimos cargar ATTOS HQ. Puede ser un problema de conexión: probá de nuevo en unos segundos.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-bordo px-5 text-sm font-semibold text-beige shadow-card transition hover:bg-bordo-dark"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
