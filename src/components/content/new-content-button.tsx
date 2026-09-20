"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentDialog } from "./content-dialog";

export function NewContentButton() {
  const { openNew } = useContentDialog();
  return (
    <Button onClick={() => openNew()}>
      <Plus className="size-4" aria-hidden />
      Nuevo contenido
    </Button>
  );
}
