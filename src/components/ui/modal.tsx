"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}

// Ventana emergente sobre el <dialog> nativo: el navegador se encarga del foco, de la tecla Esc
// y de bloquear lo que hay detrás. El contenido solo existe mientras está abierta, así cada
// apertura arranca con el formulario limpio.
export function Modal({ open, onClose, title, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose(); // click en el fondo oscuro
      }}
      className={cn(
        "m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-ink/30 backdrop:backdrop-blur-[2px]",
        className,
      )}
    >
      {open && (
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 id={titleId} className="font-display text-2xl font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mr-2 -mt-1 inline-flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-beige hover:text-ink"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
