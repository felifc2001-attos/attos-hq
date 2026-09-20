"use client";

import { TriangleAlert } from "lucide-react";
import { useCreateDialog } from "@/components/quick-create/create-dialog";
import { Button } from "@/components/ui/button";

// Siempre a mano: en el celular queda solo el ícono. Lo reportado llega a la bandeja de Sistemas (ver /sistemas).
export function ReportIssueButton() {
  const { open } = useCreateDialog();
  return (
    <Button
      variant="warning"
      size="sm"
      aria-label="Reportar problema"
      title="Reportar problema"
      className="max-sm:size-11 max-sm:px-0"
      onClick={() => open("issue")}
    >
      <TriangleAlert className="size-4" aria-hidden />
      <span className="hidden sm:inline">Reportar problema</span>
    </Button>
  );
}
