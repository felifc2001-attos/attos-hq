import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardTitle } from "@/components/ui/card";
import type { ProfileData } from "@/lib/profile/types";

/** Las personas del equipo; cada una lleva a su perfil. */
export function TeamList({ team, meId }: { team: ProfileData[]; meId: string }) {
  return (
    <Card>
      <CardTitle>El equipo</CardTitle>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((person) => (
          <li key={person.id}>
            <Link
              href={person.id === meId ? "/perfil" : `/perfil/${person.id}`}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-beige/70"
            >
              <Avatar
                member={{ name: person.fullName, initials: person.fullName.trim().charAt(0).toUpperCase(), color: person.color }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {person.fullName}
                  {person.id === meId && " (vos)"}
                </span>
                <span className="block truncate text-xs text-muted">{person.area || "Sin área"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
