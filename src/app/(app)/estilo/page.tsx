import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TEAM_LIST } from "@/lib/team";

const BRAND = [
  { name: "Bordó ATTOS", hex: "#631636", cls: "bg-bordo" },
  { name: "Bordó oscuro", hex: "#4a0f28", cls: "bg-bordo-dark" },
  { name: "Bordó suave", hex: "#f3e4ea", cls: "bg-bordo-soft" },
  { name: "Beige ATTOS", hex: "#f4ede3", cls: "bg-beige" },
  { name: "Beige profundo", hex: "#e9dfd0", cls: "bg-beige-deep" },
  { name: "Superficie", hex: "#fffdf9", cls: "bg-surface" },
];

const CATEGORIES = [
  { name: "Comercial", cls: "bg-cat-comercial" },
  { name: "Marketing", cls: "bg-cat-marketing" },
  { name: "Sistemas", cls: "bg-cat-sistemas" },
  { name: "Operaciones", cls: "bg-cat-operaciones" },
  { name: "Reuniones", cls: "bg-cat-reuniones" },
];

export const metadata: Metadata = { title: "Guía de estilo" };

export default function EstiloPage() {
  return (
    <>
      <PageHeader
        title="Guía de estilo"
        subtitle="Colores, tipografía y componentes de ATTOS HQ."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardTitle>Identidad</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {BRAND.map((color) => (
              <div key={color.name}>
                <div className={`h-16 rounded-2xl border border-line ${color.cls}`} />
                <p className="mt-2 text-sm font-semibold text-ink">{color.name}</p>
                <p className="text-xs text-muted">{color.hex}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Tipografía</CardTitle>
          <p className="mt-4 font-display text-4xl font-semibold text-ink">
            Buenos días, Felipe
          </p>
          <p className="mt-1 text-xs text-muted">Títulos · Fraunces</p>
          <p className="mt-5 text-base text-ink">
            Esto es lo que tenés que hacer hoy y lo que está pasando en ATTOS.
          </p>
          <p className="mt-1 text-xs text-muted">Texto · Plus Jakarta Sans</p>
        </Card>

        <Card>
          <CardTitle>Personas</CardTitle>
          <ul className="mt-4 space-y-3">
            {TEAM_LIST.map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <Avatar member={member} size="lg" />
                <div>
                  <p className="font-semibold text-ink">{member.name}</p>
                  <p className="text-sm text-muted">{member.area}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Estados y prioridades</CardTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="todo">Por hacer</Badge>
            <Badge tone="doing">En curso</Badge>
            <Badge tone="review">Para revisar</Badge>
            <Badge tone="done">Listo</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="low">Baja</Badge>
            <Badge tone="mid">Media</Badge>
            <Badge tone="high">Alta</Badge>
            <Badge tone="urgent">Urgente</Badge>
          </div>
        </Card>

        <Card>
          <CardTitle>Categorías del calendario</CardTitle>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
            {CATEGORIES.map((category) => (
              <li key={category.name} className="flex items-center gap-2 text-sm text-ink">
                <span className={`size-3 rounded-full ${category.cls}`} aria-hidden />
                {category.name}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Botones</CardTitle>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button>Principal</Button>
            <Button variant="soft">Suave</Button>
            <Button variant="outline">Contorno</Button>
            <Button variant="ghost">Discreto</Button>
            <Button variant="warning">Reportar problema</Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Progreso</CardTitle>
          <div className="mt-4 space-y-4">
            <ProgressBar value={80} label="Campaña Día de la Madre" />
            <ProgressBar value={45} label="Ejemplo 45%" barClassName="bg-cami" />
            <ProgressBar value={15} label="Ejemplo 15%" barClassName="bg-bauti" />
          </div>
        </Card>
      </div>
    </>
  );
}
