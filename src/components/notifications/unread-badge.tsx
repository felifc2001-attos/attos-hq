import { getCurrentUser } from "@/lib/auth/session";
import { getUnreadCount } from "@/lib/notifications/queries";
import { cn } from "@/lib/utils";

// Cantidad de notificaciones sin leer. Se usa dentro de <Suspense> para que no demore el resto de la pantalla,
// y si falla la consulta simplemente no se muestra el número (no rompe la página).
export async function UnreadBadge({ className }: { className?: string }) {
  let count = 0;
  try {
    const me = await getCurrentUser();
    count = await getUnreadCount(me.id);
  } catch (error) {
    // redirect() de getCurrentUser también llega hasta acá: se vuelve a lanzar para que Next lo maneje.
    if (error instanceof Error && "digest" in error) throw error;
    console.error("[notificaciones] No se pudo contar las sin leer:", error);
  }
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-bordo px-1.5 text-[0.7rem] font-bold leading-none text-beige",
        className,
      )}
    >
      <span aria-hidden>{count > 9 ? "9+" : count}</span>
      <span className="sr-only">{count === 1 ? "1 sin leer" : `${count} sin leer`}</span>
    </span>
  );
}
