// Panel de quien atiende los tickets. Es la vista que existia antes en
// /admin: atender, cerrar y consultar, sin poder borrar nada.
//
// La proteccion real de la ruta ocurre en middleware.ts (redirige a
// /soporte/login si no hay sesion); esta pagina solo vuelve a leer la sesion
// para mostrar el nombre en el saludo, por eso `sesion?.nombre` usa un
// respaldo en vez de asumir que sesion nunca sera null.
import { esAdmin, obtenerSesionActual } from "@/lib/auth";
import AdminDashboard from "@/components/panel/AdminDashboard";
import BotonCerrarSesion from "@/components/panel/BotonCerrarSesion";
import NombreAdmin from "@/components/panel/NombreAdmin";
import SiteHeader from "@/components/layout/SiteHeader";

export default async function SoportePage() {
  const sesion = await obtenerSesionActual();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader right={<BotonCerrarSesion />} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-brand-950">Panel de soporte</h1>
          {/* El nombre se puede cambiar desde aqui: es el mismo que queda
              como "Atendido por" en los tickets que cierra este usuario. */}
          <NombreAdmin nombreInicial={sesion?.nombre ?? "soporte"} />
        </div>

        {/* Si el lider de TI entra por esta URL conserva sus permisos: el
            borrado depende del rol, no de la direccion por la que llego. */}
        <AdminDashboard puedeEliminar={esAdmin(sesion)} />
      </main>
    </div>
  );
}
