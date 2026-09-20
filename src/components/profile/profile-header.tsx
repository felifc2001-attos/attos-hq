import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ProfileData } from "@/lib/profile/types";
import { AREAS, findOption } from "@/lib/tasks/constants";

/** El nombre, el área y el avatar de una persona (con su color). */
export function ProfileHeader({ profile, showEmail }: { profile: ProfileData; showEmail?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar
        member={{ name: profile.fullName, initials: profile.fullName.trim().charAt(0).toUpperCase(), color: profile.color }}
        size="lg"
      />
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{profile.fullName}</h1>
        {profile.area && <p className="mt-1 text-muted">{profile.area}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          {profile.defaultArea && <Badge tone="wine">{findOption(AREAS, profile.defaultArea).label}</Badge>}
          {showEmail && profile.email && <span className="truncate">{profile.email}</span>}
        </div>
      </div>
    </div>
  );
}
