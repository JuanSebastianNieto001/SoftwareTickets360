"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <button onClick={cerrarSesion} className="btn-secondary" disabled={cargando}>
      {cargando ? "Saliendo..." : "Cerrar sesion"}
    </button>
  );
}
