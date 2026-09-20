import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./page-header";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  stage: string;
  features: string[];
  children?: React.ReactNode;
}

export function PlaceholderPage({
  icon: Icon,
  title,
  subtitle,
  stage,
  features,
  children,
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="mx-auto max-w-2xl p-8 text-center sm:p-12">
        <span className="mx-auto inline-flex size-16 items-center justify-center rounded-2xl bg-bordo-soft text-bordo">
          <Icon className="size-8" aria-hidden />
        </span>
        <Badge tone="wine" className="mt-5">
          Próximamente · {stage}
        </Badge>
        <p className="mt-4 text-sm font-semibold text-ink">Va a incluir:</p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        {children}
      </Card>
    </>
  );
}
