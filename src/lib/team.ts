export type MemberId = "felipe" | "bauti" | "cami";

export interface TeamMember {
  id: MemberId;
  name: string;
  area: string;
  initials: string;
  /** Clases de Tailwind completas (para que se generen): fondo sólido, fondo suave y texto. */
  bg: string;
  soft: string;
  text: string;
}

export const TEAM: Record<MemberId, TeamMember> = {
  felipe: {
    id: "felipe",
    name: "Felipe",
    area: "Comercial & Operaciones",
    initials: "F",
    bg: "bg-felipe",
    soft: "bg-felipe/10",
    text: "text-felipe",
  },
  bauti: {
    id: "bauti",
    name: "Bauti",
    area: "Marketing, Redes & Diseño",
    initials: "B",
    bg: "bg-bauti",
    soft: "bg-bauti/10",
    text: "text-bauti",
  },
  cami: {
    id: "cami",
    name: "Cami",
    area: "Sistemas",
    initials: "C",
    bg: "bg-cami",
    soft: "bg-cami/10",
    text: "text-cami",
  },
};

export const TEAM_LIST = Object.values(TEAM);
