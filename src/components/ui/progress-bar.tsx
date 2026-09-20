"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** Valor de 0 a 100. */
  value: number;
  label?: string;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({
  value,
  label,
  className,
  barClassName,
}: ProgressBarProps) {
  const safe = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-beige-deep", className)}
    >
      <motion.div
        className={cn("h-full rounded-full bg-bordo", barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${safe}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
