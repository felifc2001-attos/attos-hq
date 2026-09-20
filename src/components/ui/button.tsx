import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-bordo text-beige hover:bg-bordo-dark shadow-card",
  soft: "bg-bordo-soft text-bordo hover:bg-bordo/15",
  outline: "border border-line bg-surface text-ink hover:bg-beige",
  ghost: "text-muted hover:bg-beige hover:text-ink",
  warning: "bg-prio-high/10 text-prio-high hover:bg-prio-high/20",
} as const;

const SIZES = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bordo",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
