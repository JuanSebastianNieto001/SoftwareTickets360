"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { IconLogout } from "@/components/ui/icons";

export default function BotonCerrarSesion() {
  const router = useRouter();
  const pathname = usePathname();
  const [cargando, setCargando] = useState(false);

  async function cerrarSesion() {
    setCargando(true);
    await fetch("/api/auth/logout", { method: "POST" });
    // Cada panel vuelve a su propio login: el boton lo comparten /admin y
    // /soporte, asi que el destino sale de donde estaba el usuario.
    router.push(pathname.startsWith("/soporte") ? "/soporte/login" : "/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={cerrarSesion}
      disabled={cargando}
      className="btn bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
    >
      <IconLogout className="h-4 w-4" />
      {cargando ? "Saliendo..." : "Cerrar sesion"}
    </button>
  );
}
