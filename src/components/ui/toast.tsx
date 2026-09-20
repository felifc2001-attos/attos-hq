"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** Muestra un aviso breve ("Idea guardada") desde cualquier parte de la app. */
export function useToast(): ShowToast {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback<ShowToast>((message) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* Por encima de la barra inferior del celular y del botón "+". */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4 lg:bottom-8 lg:left-64"
      >
        <AnimatePresence>
          {toast && (
            <motion.p
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-beige shadow-float"
            >
              <Check className="size-4 text-st-done" strokeWidth={3} aria-hidden />
              {toast.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
