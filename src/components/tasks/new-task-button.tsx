"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskDialog, type TaskDefaults } from "./task-dialog";

interface NewTaskButtonProps {
  label?: string;
  /** Datos con los que arranca la tarea (por ejemplo, el proyecto desde el que se crea). */
  defaults?: TaskDefaults;
  variant?: "primary" | "soft" | "outline";
}

export function NewTaskButton({ label = "Nueva tarea", defaults, variant }: NewTaskButtonProps) {
  const { openNew } = useTaskDialog();
  return (
    // Se llama sin pasar el evento del clic: openNew espera los datos de partida, no un evento.
    <Button variant={variant} onClick={() => openNew(defaults)}>
      <Plus className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
