import TicketForm from "@/components/TicketForm";

export default function InicioPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Soporte Tecnico Interno</h1>
        <p className="mt-2 text-sm text-slate-600">
          Reporta una falla o solicitud y te asignaremos un codigo de seguimiento. No necesitas
          iniciar sesion.
        </p>
      </header>

      <TicketForm />

      <footer className="mt-8 flex flex-col items-center gap-2 text-sm text-slate-500">
        <a href="/seguimiento" className="text-brand-600 hover:underline">
          ¿Ya tienes un ticket? Consulta su estado aqui
        </a>
        <a href="/admin/login" className="text-slate-400 hover:underline">
          Acceso administrador
        </a>
      </footer>
    </main>
  );
}
