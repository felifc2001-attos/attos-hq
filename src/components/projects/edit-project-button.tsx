"use client";

import { Pencil } from "lucide-react";
import { useCreateDialog } from "@/components/quick-create/create-dialog";
import { Button } from "@/components/ui/button";
import type { EditableProject } from "@/lib/projects/types";

export function EditProjectButton({ project }: { project: EditableProject }) {
  const { openEditProject } = useCreateDialog();
  return (
    <Button variant="outline" onClick={() => openEditProject(project)}>
      <Pencil className="size-4" aria-hidden />
      Editar
    </Button>
  );
}
