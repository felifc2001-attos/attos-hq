"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { FOOTER_NAV, MAIN_NAV, isActive } from "@/lib/navigation";
import { LogOut } from "lucide-react";
import type { CurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { Avatar } from "@/components/ui/avatar";
import { Brand } from "./brand";

interface SidebarProps {
  user: CurrentUser;
  /** El número de notificaciones sin leer; llega ya armado desde el servidor. */
  notificationsBadge?: React.ReactNode;
}

export function Sidebar({ user, notificationsBadge }: SidebarProps) {
  const pathname = usePathname();
  const settings = FOOTER_NAV.find((item) => item.href === "/configuracion");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/80 px-4 py-6 backdrop-blur lg:flex">
      <div className="px-3">
        <Brand />
      </div>

      <nav aria-label="Principal" className="mt-8 flex flex-1 flex-col gap-1">
        {MAIN_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active ? "text-bordo" : "text-muted hover:bg-beige hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-bordo-soft"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <Icon className="relative size-5" aria-hidden />
              <span className="relative">{item.label}</span>
              {item.href === "/notificaciones" && <span className="relative ml-auto">{notificationsBadge}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-1 border-t border-line pt-4">
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-beige"
        >
          <Avatar member={user} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">
              {user.name}
            </span>
            <span className="block truncate text-xs text-muted">
              {user.area}
            </span>
          </span>
        </Link>
        {settings && (
          <Link
            href={settings.href}
            aria-current={isActive(pathname, settings.href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              isActive(pathname, settings.href)
                ? "bg-bordo-soft text-bordo"
                : "text-muted hover:bg-beige hover:text-ink",
            )}
          >
            <settings.icon className="size-5" aria-hidden />
            {settings.label}
          </Link>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-beige hover:text-ink"
          >
            <LogOut className="size-5" aria-hidden />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
