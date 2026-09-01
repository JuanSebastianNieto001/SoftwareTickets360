import SeguimientoBuscador from "@/components/SeguimientoBuscador";

export default function SeguimientoPage({
  searchParams,
}: {
  searchParams: { codigo?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-10">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Consultar estado del ticket</h1>
        <p className="mt-2 text-sm text-slate-600">
          Escribe el codigo que recibiste al crear tu solicitud.
        </p>
      </header>

      <SeguimientoBuscador codigoInicial={searchParams.codigo} />

      <footer className="mt-8 text-center">
        <a href="/" className="text-sm text-brand-600 hover:underline">
          ← Crear un nuevo ticket
        </a>
      </footer>
    </main>
  );
}
