"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Se muestra cuando una pantalla falla al cargar (por ejemplo, si se cae la conexión con la base).
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-xl p-10 text-center">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-prio-urgent/10 text-prio-urgent">
        <TriangleAlert className="size-7" aria-hidden />
      </span>
      <p className="mt-4 font-semibold text-ink">No pudimos cargar esta pantalla.</p>
      <p className="mt-1 text-sm text-muted">Puede ser un problema de conexión. Probá de nuevo.</p>
      <Button onClick={reset} className="mt-5">
        Reintentar
      </Button>
    </Card>
  );
}
