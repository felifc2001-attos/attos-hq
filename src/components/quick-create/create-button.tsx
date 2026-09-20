"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateDialog, type CreateKind } from "./create-dialog";

/** Botón que abre el formulario de creación de un tipo (idea, proyecto…), por ejemplo en el encabezado de una pantalla. */
export function CreateButton({ kind, label }: { kind: CreateKind; label: string }) {
  const { open } = useCreateDialog();
  return (
    <Button onClick={() => open(kind)}>
      <Plus className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
