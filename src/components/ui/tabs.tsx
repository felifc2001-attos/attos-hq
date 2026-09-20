"use client";

import { cn } from "@/lib/utils";

interface TabsProps<T extends string> {
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  /** Prefijo para los ids que enlazan cada pestaña con su panel (aria-controls / aria-labelledby). */
  idPrefix: string;
  label: string;
}

/** Barra de pestañas accesible. Cada panel debe tener id `${idPrefix}-panel-${id}` y aria-labelledby `${idPrefix}-tab-${id}`. */
export function Tabs<T extends string>({ tabs, value, onChange, idPrefix, label }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="-mt-2 mb-5 flex gap-1 border-b border-line">
      {tabs.map(({ id, label: text }) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${id}`}
          aria-selected={value === id}
          aria-controls={`${idPrefix}-panel-${id}`}
          onClick={() => onChange(id)}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
            value === id ? "border-bordo text-bordo" : "border-transparent text-muted hover:text-ink",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
