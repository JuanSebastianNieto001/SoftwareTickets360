import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soporte TI",
  description: "Sistema de gestion de soportes tecnicos internos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
