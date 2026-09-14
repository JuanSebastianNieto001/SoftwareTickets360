// Pantalla contenedora del panel de admin. La proteccion real de la ruta
// ocurre en middleware.ts (redirige a /admin/login si no hay sesion); esta
// pagina solo vuelve a leer la sesion para mostrar el nombre en el saludo,
// por eso `sesion?.nombre` usa `?? "administrador"` como respaldo en vez de
// asumir que sesion nunca sera null.
import { obtenerSesionActual } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import NombreAdmin from "@/components/NombreAdmin";
import SiteHeader from "@/components/SiteHeader";

export default async function AdminPage() {
  const sesion = await obtenerSesionActual();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader right={<BotonCerrarSesion />} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-brand-950">Panel de soporte</h1>
          {/* El nombre se puede cambiar desde aqui: es el mismo que queda
              como "Atendido por" en los tickets que cierra este usuario. */}
          <NombreAdmin nombreInicial={sesion?.nombre ?? "administrador"} />
        </div>

        <AdminDashboard />
      </main>
    </div>
  );
}
