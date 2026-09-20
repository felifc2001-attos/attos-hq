import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogOut } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileOverviewView } from "@/components/profile/profile-overview";
import { TeamList } from "@/components/profile/team-list";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { todayISO } from "@/lib/dates";
import { getProfileOverview, getTeamProfiles } from "@/lib/profile/queries";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const me = await getCurrentUser();
  const today = todayISO();

  const [overview, team] = await Promise.all([getProfileOverview(me.id, me.id, today), getTeamProfiles()]);
  if (!overview) notFound();

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <ProfileHeader profile={overview.profile} showEmail />
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="size-4" aria-hidden />
            Cerrar sesión
          </Button>
        </form>
      </div>

      <ProfileOverviewView overview={overview} today={today} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ProfileForm profile={overview.profile} />
        <TeamList team={team} meId={me.id} />
      </div>
    </>
  );
}
