// Panel del lider de TI. Ademas de todo lo que ve el soporte, aqui se puede
// borrar tickets (para no agotar el plan gratuito de la base), gestionar las
// cuentas y leer la bitacora de actividad.
//
// El acceso lo controla middleware.ts, que exige rol ADMIN para cualquier
// ruta bajo /admin: un soporte con sesion valida que entre por esta URL
// termina en /soporte, no en un error.
import { obtenerSesionActual } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import NombreAdmin from "@/components/NombreAdmin";
import PanelUsuarios from "@/components/PanelUsuarios";
import RegistroActividad from "@/components/RegistroActividad";
import SiteHeader from "@/components/SiteHeader";

export default async function AdminPage() {
  const sesion = await obtenerSesionActual();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader right={<BotonCerrarSesion />} />

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-brand-950">
              Panel del lider de TI
            </h1>
            <span className="badge bg-brand-100 text-brand-700">Administrador</span>
          </div>
          <NombreAdmin nombreInicial={sesion?.nombre ?? "administrador"} />
        </div>

        {/* Mismo tablero que ve el soporte, con los controles de borrado. */}
        <AdminDashboard puedeEliminar />

        <PanelUsuarios />

        <RegistroActividad />
      </main>
    </div>
  );
}
