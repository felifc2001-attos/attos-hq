import type { Metadata } from "next";
import { Brand } from "@/components/layout/brand";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Brand />
      <Card className="mt-8 w-full max-w-sm p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Bienvenido</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Entrá con tu cuenta del equipo ATTOS.</p>
        <LoginForm />
      </Card>
    </main>
  );
}
