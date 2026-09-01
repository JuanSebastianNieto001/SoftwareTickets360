"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconLogout } from "@/components/icons";

export default function BotonCerrarSesion() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function cerrarSesion() {
    setCargando(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
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
