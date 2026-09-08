// Logo chico "isotipo + nombre" para barras de navegacion (SiteHeader, admin).
// Para el logo grande y animado de las pantallas de entrada, ver HeroLogo.tsx.
import Image from "next/image";

export default function VozLogo({ withTagline = true }: { withTagline?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo-voz360.png"
        alt="VOZ360"
        width={40}
        height={40}
        className="h-10 w-10 shrink-0"
        priority
      />
      <div className="leading-tight">
        <p className="font-display text-lg font-extrabold tracking-tight text-white">VOZ360</p>
        {withTagline && <p className="text-[11px] font-medium text-brand-200">Conecta con Soluciones</p>}
      </div>
    </div>
  );
}
