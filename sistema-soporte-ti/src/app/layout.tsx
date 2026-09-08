// Layout raiz: registra las dos familias tipograficas de la marca como
// variables CSS (--font-display para titulos, --font-body para el resto),
// mapeadas en tailwind.config.ts como fontFamily.display / fontFamily.sans.
import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VOZ360 · Soporte TI",
  description: "Sistema de gestion de soportes tecnicos internos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sora.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
