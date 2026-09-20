import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { Card } from "@/components/ui/card";

// Una dirección que no existe (por ejemplo, un enlace mal copiado).
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Brand />
      <Card className="mt-8 w-full max-w-sm p-6 text-center sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">No encontramos esa página</h1>
        <p className="mt-2 text-sm text-muted">Puede que el enlace esté mal copiado o que ya no exista.</p>
        <Link
          href="/"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-bordo px-5 text-sm font-semibold text-beige shadow-card transition hover:bg-bordo-dark"
        >
          Ir al inicio
        </Link>
      </Card>
    </main>
  );
}
