"use client";

// fetch para la API privada que le dice al servidor desde que panel se llama
// (cabecera x-panel). Sin esto, con una pestana de /admin y otra de /soporte
// abiertas, el servidor no sabria con cual de las dos sesiones actuar.
// Ver src/lib/panel.ts.
import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { CABECERA_PANEL, panelDeRuta, type Panel } from "@/lib/panel";

/** Panel de la pagina actual, segun la URL. */
export function usePanel(): Panel {
  return panelDeRuta(usePathname() ?? "");
}

/** Igual que fetch, pero con la cabecera del panel ya puesta. */
export function useApiPanel() {
  const panel = usePanel();
  return useCallback(
    (url: string, init: RequestInit = {}) => {
      const cabeceras = new Headers(init.headers);
      cabeceras.set(CABECERA_PANEL, panel);
      return fetch(url, { ...init, headers: cabeceras });
    },
    [panel]
  );
}
