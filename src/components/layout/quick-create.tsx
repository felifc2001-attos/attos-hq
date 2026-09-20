"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bug,
  CalendarPlus,
  Handshake,
  Lightbulb,
  Megaphone,
  Plus,
  Rocket,
  SquareCheckBig,
  type LucideIcon,
} from "lucide-react";
import { useContentDialog } from "@/components/content/content-dialog";
import { useCreateDialog, type CreateKind } from "@/components/quick-create/create-dialog";
import { useTaskDialog } from "@/components/tasks/task-dialog";
import { cn } from "@/lib/utils";

const ACTIONS: { id: "task" | "content" | CreateKind; label: string; icon: LucideIcon }[] = [
  { id: "task", label: "Nueva tarea", icon: SquareCheckBig },
  { id: "idea", label: "Nueva idea", icon: Lightbulb },
  { id: "content", label: "Nuevo contenido", icon: Megaphone },
  { id: "issue", label: "Reportar problema", icon: Bug },
  { id: "event", label: "Nuevo evento", icon: CalendarPlus },
  { id: "project", label: "Nuevo proyecto", icon: Rocket },
  { id: "dependency", label: "Necesito de…", icon: Handshake },
];

export function QuickCreate() {
  const [open, setOpen] = useState(false);
  const { openNew: openNewTask } = useTaskDialog();
  const { openNew: openNewContent } = useContentDialog();
  const { open: openCreate } = useCreateDialog();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="quick-backdrop"
            className="fixed inset-0 z-[55] bg-ink/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[60] flex flex-col items-end gap-3 lg:bottom-8 lg:right-8">
        <AnimatePresence>
          {open && (
            <motion.ul
              key="quick-menu"
              className="flex flex-col items-end gap-2"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                visible: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
                hidden: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
              }}
            >
              {ACTIONS.map(({ id, label, icon: Icon }) => (
                <motion.li
                  key={id}
                  variants={{
                    hidden: { opacity: 0, y: 12, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (id === "task") openNewTask();
                      else if (id === "content") openNewContent();
                      else openCreate(id);
                    }}
                    className="flex items-center gap-3 rounded-full bg-surface py-2 pl-5 pr-2 text-sm font-semibold text-ink shadow-float transition hover:bg-bordo-soft active:scale-95"
                  >
                    {label}
                    <span className="inline-flex size-9 items-center justify-center rounded-full bg-bordo-soft text-bordo">
                      <Icon className="size-[1.1rem]" aria-hidden />
                    </span>
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <button
          type="button"
          aria-label="Creación rápida"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "inline-flex size-14 items-center justify-center rounded-full bg-bordo text-beige shadow-float transition hover:bg-bordo-dark active:scale-95",
          )}
        >
          <Plus
            className={cn(
              "size-7 transition-transform duration-200",
              open && "rotate-45",
            )}
            aria-hidden
          />
        </button>
      </div>
    </>
  );
}
