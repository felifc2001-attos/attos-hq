import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line/70 bg-surface p-6 shadow-card",
        interactive &&
          "transition duration-200 hover:-translate-y-0.5 hover:shadow-float",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("font-display text-lg font-semibold text-ink", className)}
      {...props}
    />
  );
}
