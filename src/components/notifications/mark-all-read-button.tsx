"use client";

import { useState, useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await markAllNotificationsRead();
            if (!result.ok) setError(result.error);
          });
        }}
      >
        <CheckCheck className="size-4" aria-hidden />
        Marcar todas como leídas
      </Button>
      {error && (
        <p role="alert" className="text-xs text-prio-urgent">
          {error}
        </p>
      )}
    </div>
  );
}
