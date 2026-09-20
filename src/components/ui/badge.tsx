import { cn } from "@/lib/utils";

export const BADGE_TONES = {
  neutral: "bg-beige-deep/70 text-muted",
  wine: "bg-bordo-soft text-bordo",
  todo: "bg-st-todo/12 text-st-todo",
  doing: "bg-st-doing/12 text-st-doing",
  review: "bg-st-review/14 text-st-review",
  done: "bg-st-done/12 text-st-done",
  low: "bg-prio-low/12 text-prio-low",
  mid: "bg-prio-mid/12 text-prio-mid",
  high: "bg-prio-high/14 text-prio-high",
  urgent: "bg-prio-urgent/12 text-prio-urgent",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        BADGE_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
