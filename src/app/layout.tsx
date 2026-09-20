import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Cada pantalla pone su nombre y se arma "Tareas · ATTOS HQ": sirve para distinguir las pestañas abiertas.
  title: { default: "ATTOS HQ", template: "%s · ATTOS HQ" },
  description: "El centro operativo interno del equipo ATTOS.",
  applicationName: "ATTOS HQ",
  // Herramienta interna: que no la indexe ningún buscador (también lo dicen robots.txt y una cabecera).
  robots: { index: false, follow: false },
  // Al agregarla a la pantalla de inicio del iPhone se abre como una app.
  appleWebApp: { capable: true, title: "ATTOS HQ", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#631636",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
