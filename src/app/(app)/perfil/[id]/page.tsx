import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileOverviewView } from "@/components/profile/profile-overview";
import { getCurrentUser } from "@/lib/auth/session";
import { todayISO } from "@/lib/dates";
import { getProfileOverview } from "@/lib/profile/queries";
import { isUuid } from "@/lib/tasks/validate";

// El perfil de un compañero: lo que tiene por hacer, en qué proyectos está y lo último que hizo.
export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (id === me.id) redirect("/perfil"); // el propio se edita en /perfil
  if (!isUuid(id)) notFound();

  const today = todayISO();
  const overview = await getProfileOverview(id, me.id, today);
  if (!overview) notFound();

  return (
    <>
      <Link href="/perfil" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-bordo hover:text-bordo-dark">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a mi perfil
      </Link>

      <div className="mb-8">
        <ProfileHeader profile={overview.profile} showEmail />
      </div>

      <ProfileOverviewView overview={overview} today={today} />
    </>
  );
}
