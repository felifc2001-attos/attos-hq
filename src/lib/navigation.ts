import {
  Bell,
  CalendarDays,
  Handshake,
  House,
  Lightbulb,
  Megaphone,
  Monitor,
  Rocket,
  Settings,
  SquareCheckBig,
  Sun,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/mi-dia", label: "Mi día", icon: Sun },
  { href: "/tareas", label: "Tareas", icon: SquareCheckBig },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/proyectos", label: "Proyectos", icon: Rocket },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/pedidos", label: "Necesito de…", icon: Handshake },
  { href: "/contenido", label: "Contenido", icon: Megaphone },
  { href: "/sistemas", label: "Sistemas", icon: Monitor },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
];

export const FOOTER_NAV: NavItem[] = [
  { href: "/perfil", label: "Perfil", icon: UserRound },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export const MOBILE_PRIMARY_NAV = MAIN_NAV.slice(0, 4);
export const MOBILE_MORE_NAV = [...MAIN_NAV.slice(4), ...FOOTER_NAV];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
