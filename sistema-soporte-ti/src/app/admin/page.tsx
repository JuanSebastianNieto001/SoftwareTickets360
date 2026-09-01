import { obtenerSesionActual } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";

export default async function AdminPage() {
  const sesion = await obtenerSesionActual();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de soporte</h1>
          <p className="text-sm text-slate-500">Hola, {sesion?.nombre ?? "administrador"}</p>
        </div>
        <BotonCerrarSesion />
      </header>

      <AdminDashboard />
    </main>
  );
}
