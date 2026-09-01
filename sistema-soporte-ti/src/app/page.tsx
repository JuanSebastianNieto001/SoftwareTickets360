import TicketForm from "@/components/TicketForm";
import HeroLogo from "@/components/HeroLogo";
import { IconHeart, IconPin, IconCube } from "@/components/icons";

export default function InicioPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <section className="voz-hero relative isolate overflow-hidden pb-28 pt-16 sm:pb-32">
        <div className="voz-dots pointer-events-none absolute inset-0 opacity-40" />

        <span className="pointer-events-none absolute right-[8%] top-10 hidden h-14 w-14 animate-float items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-sm sm:flex">
          <IconHeart className="h-6 w-6" />
        </span>
        <span className="pointer-events-none absolute left-[6%] top-24 hidden h-16 w-16 animate-float-delay items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-sm sm:flex">
          <IconPin className="h-7 w-7" />
        </span>
        <span className="pointer-events-none absolute bottom-10 right-[14%] hidden h-12 w-12 animate-float items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-sm sm:flex">
          <IconCube className="h-5 w-5" />
        </span>

        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <HeroLogo />
          <h1 className="text-balance font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Soporte Tecnico Interno
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-balance text-sm text-brand-200 sm:text-base">
            Reporta una falla o solicitud y te asignaremos un codigo de seguimiento. No necesitas
            iniciar sesion.
          </p>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-20 w-full max-w-2xl flex-1 px-4 pb-14 sm:-mt-24">
        <TicketForm />

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <a href="/seguimiento" className="font-medium text-brand-700 hover:underline">
            ¿Ya tienes un ticket? Consulta su estado aqui
          </a>
          <a href="/admin/login" className="text-slate-400 hover:underline">
            Acceso administrador
          </a>
        </div>
      </main>
    </div>
  );
}
