import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LiveStatus } from "@/components/settings/live-status";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { PasswordForm } from "@/components/settings/password-form";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getNotificationPreferences } from "@/lib/profile/queries";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const me = await getCurrentUser();
  const preferences = await getNotificationPreferences(me.id);

  return (
    <>
      <PageHeader title="Configuración" subtitle="Preferencias de tu cuenta." />

      <div className="max-w-3xl space-y-6">
        <Card>
          <CardTitle>Notificaciones</CardTitle>
          <p className="mb-2 mt-1 text-sm text-muted">
            Elegí qué avisos querés recibir. Los que desactives dejan de crearse; los que ya te llegaron no se borran.
          </p>
          <NotificationPreferences preferences={preferences} />
        </Card>

        <Card>
          <CardTitle>Actualización en vivo</CardTitle>
          <div className="mt-3">
            <LiveStatus />
          </div>
        </Card>

        <Card>
          <CardTitle>Contraseña</CardTitle>
          <p className="mb-4 mt-1 text-sm text-muted">Tu sesión sigue abierta en este dispositivo después de cambiarla.</p>
          <PasswordForm />
        </Card>

        <Card>
          <CardTitle>Tu cuenta</CardTitle>
          <p className="mt-2 text-sm text-muted">
            Entrás con <span className="font-semibold text-ink">{me.email}</span>. Tu nombre, tu rol y tu color se cambian desde{" "}
            <Link href="/perfil" className="font-semibold text-bordo underline underline-offset-4">
              tu perfil
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="size-4" aria-hidden />
                Cerrar sesión
              </Button>
            </form>
            <Link href="/estilo" className="text-sm font-semibold text-bordo underline underline-offset-4 hover:text-bordo-dark">
              Ver la guía de estilo de ATTOS HQ
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
