import Image from "next/image";

export default function HeroLogo({ size = 112 }: { size?: number }) {
  return (
    <div className="mx-auto mb-6 flex justify-center">
      <div className="relative animate-float">
        <span className="absolute inset-0 -z-10 animate-pulse rounded-full bg-brand-400/40 blur-2xl" />
        <Image
          src="/logo-voz360.png"
          alt="VOZ360"
          width={size}
          height={size}
          priority
          className="drop-shadow-[0_10px_30px_rgba(4,51,98,0.55)]"
        />
      </div>
    </div>
  );
}
