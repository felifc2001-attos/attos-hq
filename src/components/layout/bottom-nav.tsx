"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOBILE_MORE_NAV,
  MOBILE_PRIMARY_NAV,
  isActive,
} from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MOBILE_MORE_NAV.some((item) => isActive(pathname, item.href));

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="more-backdrop"
              className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="more-sheet"
              role="dialog"
              aria-label="Más secciones"
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-surface px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3 shadow-float lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-beige-deep" />
              <ul className="grid grid-cols-3 gap-2">
                {MOBILE_MORE_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-semibold transition active:scale-95",
                          active
                            ? "bg-bordo-soft text-bordo"
                            : "text-muted hover:bg-beige",
                        )}
                      >
                        <Icon className="size-6" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-[45] flex items-stretch border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {MOBILE_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold transition-colors",
                active ? "text-bordo" : "text-muted",
              )}
            >
              <Icon className="size-6" aria-hidden />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold transition-colors",
            moreActive || moreOpen ? "text-bordo" : "text-muted",
          )}
        >
          <Ellipsis className="size-6" aria-hidden />
          Más
        </button>
      </nav>
    </>
  );
}
