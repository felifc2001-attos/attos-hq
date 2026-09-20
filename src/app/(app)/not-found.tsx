import Link from "next/link";
import { SearchX } from "lucide-react";
import { Card } from "@/components/ui/card";

// Algo que ya no existe (un perfil o un proyecto borrado, por ejemplo): se muestra dentro de la app, con el menú a la vista.
export default function AppNotFound() {
  return (
    <Card className="mx-auto mt-10 max-w-xl p-10 text-center">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-bordo-soft text-bordo">
        <SearchX className="size-7" aria-hidden />
      </span>
      <h1 className="mt-4 font-semibold text-ink">No encontramos lo que buscabas.</h1>
      <p className="mt-1 text-sm text-muted">Puede que lo hayan eliminado o que el enlace esté incompleto.</p>
      <Link
        href="/"
        className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-bordo px-5 text-sm font-semibold text-beige shadow-card transition hover:bg-bordo-dark"
      >
        Ir al inicio
      </Link>
    </Card>
  );
}
