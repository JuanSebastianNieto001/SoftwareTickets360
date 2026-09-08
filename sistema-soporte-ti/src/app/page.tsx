import TicketForm from "@/components/TicketForm";
import HeroLogo from "@/components/HeroLogo";
import { IconHeart, IconPin, IconCube } from "@/components/icons";

export default function InicioPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <section className="voz-hero relative isolate overflow-hidden pb-16 pt-6 sm:pb-20">
        <div className="voz-dots pointer-events-none absolute inset-0 opacity-40" />

        <span className="pointer-events-none absolute right-[8%] top-6 hidden h-12 w-12 animate-float items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-sm sm:flex">
          <IconHeart className="h-5 w-5" />
        </span>
        <span className="pointer-events-none absolute left-[6%] top-16 hidden h-14 w-14 animate-float-delay items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-sm sm:flex">
          <IconPin className="h-6 w-6" />
        </span>
        <span className="pointer-events-none absolute bottom-6 right-[14%] hidden h-10 w-10 animate-float items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-sm sm:flex">
          <IconCube className="h-4 w-4" />
        </span>

        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <HeroLogo size={72} />
          <h1 className="text-balance font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Soporte Tecnico Interno
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-balance text-xs text-brand-200 sm:text-sm">
            Reporta una falla o solicitud y te asignaremos un codigo de seguimiento. No necesitas
            iniciar sesion.
          </p>
        </div>
      </section>

      {/* relative z-10 es necesario aqui, no solo decorativo: el <section>
          de arriba tiene position: relative (por "isolate"), asi que sin
          esto el <main> (position: static) pinta DEBAJO del hero en la
          franja donde se solapan por el margen negativo, y la mitad
          superior de la tarjeta queda invisible aunque el DOM este bien. */}
      <main className="relative z-10 mx-auto -mt-10 w-full max-w-2xl flex-1 px-4 pb-8 sm:-mt-12">
        <TicketForm />

        {/* Sin enlace al panel de admin: el administrador entra escribiendo
            /admin/login directo, no hace falta mostrarselo a todo el mundo. */}
        <div className="mt-4 text-center text-sm">
          <a href="/seguimiento" className="font-medium text-brand-700 hover:underline">
            ¿Ya tienes un ticket? Consulta su estado aqui
          </a>
        </div>
      </main>
    </div>
  );
}
