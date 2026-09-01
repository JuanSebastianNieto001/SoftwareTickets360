import SeguimientoBuscador from "@/components/SeguimientoBuscador";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function SeguimientoPage({
  searchParams,
}: {
  searchParams: { codigo?: string };
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <section className="voz-hero relative isolate overflow-hidden pb-20 pt-14">
        <div className="voz-dots pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-xl px-4 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
            Consultar estado del ticket
          </h1>
          <p className="mt-3 text-sm text-brand-200">
            Escribe el codigo que recibiste al crear tu solicitud.
          </p>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-12 w-full max-w-xl flex-1 px-4 pb-14">
        <SeguimientoBuscador codigoInicial={searchParams.codigo} />

        <div className="mt-6 text-center">
          <a href="/" className="text-sm font-medium text-brand-700 hover:underline">
            ← Crear un nuevo ticket
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
