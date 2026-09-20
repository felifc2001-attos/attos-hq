import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-2xl",
} as const;

// Sirve tanto para los miembros de ejemplo (TeamMember, con clase `bg`)
// como para una persona real de la base (con `color` en hexadecimal).
interface AvatarPerson {
  name: string;
  initials: string;
  bg?: string;
  color?: string;
}

interface AvatarProps {
  member: AvatarPerson;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Avatar de una persona real de la base (con su color). Si no hay persona, un "?" neutro. */
export function PersonAvatar({
  person,
  ...props
}: { person: { fullName: string; color: string } | null } & Omit<AvatarProps, "member">) {
  const { fullName, color } = person ?? { fullName: "Alguien", color: "#7d6c73" };
  return (
    <Avatar
      member={{ name: fullName, initials: person ? fullName.trim().charAt(0).toUpperCase() : "?", color }}
      {...props}
    />
  );
}

export function Avatar({ member, size = "md", className }: AvatarProps) {
  return (
    <span
      title={member.name}
      style={member.color ? { backgroundColor: member.color } : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white ring-2 ring-surface",
        member.bg,
        SIZES[size],
        className,
      )}
    >
      {member.initials}
    </span>
  );
}
