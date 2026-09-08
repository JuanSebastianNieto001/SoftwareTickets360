// Barra superior con el logo. Solo se usa en el panel de admin: las
// pantallas publicas (formulario, seguimiento, login) usan HeroLogo en su
// lugar para un tratamiento mas grande y centrado.
import VozLogo from "@/components/VozLogo";

export default function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="bg-brand-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <VozLogo />
        {right}
      </div>
    </header>
  );
}
