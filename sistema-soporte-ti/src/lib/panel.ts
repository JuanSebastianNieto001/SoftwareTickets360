// Los dos paneles autenticados y la cookie de sesion de cada uno.
//
// Cada panel tiene su PROPIA cookie para que se puedan tener abiertas a la
// vez, en el mismo navegador, una pestana de /admin y otra de /soporte (por
// ejemplo con cuentas distintas). Con una sola cookie compartida, iniciar
// sesion en una pisaba la otra, y cerrar sesion en una sacaba a las dos.
//
// Modulo puro: lo importan el middleware (Edge Runtime), el servidor y los
// componentes del navegador.

export const PANELES = ["admin", "soporte"] as const;
export type Panel = (typeof PANELES)[number];

/**
 * Cabecera con la que el navegador le dice a la API desde que panel llama.
 * Hace falta porque las rutas /api/admin/* las usan los dos paneles: sin
 * ella el servidor no sabria cual de las dos cookies leer. No da permisos:
 * solo elige entre sesiones que el navegador ya tiene y que se validan igual.
 */
export const CABECERA_PANEL = "x-panel";

/** Nombre de la cookie de sesion de cada panel. */
export function cookieDePanel(panel: Panel): string {
  return `soporte_ti_sesion_${panel}`;
}

/** Cookie de la version anterior (una sola para los dos paneles). Solo se borra al iniciar sesion. */
export const COOKIE_LEGADA = "soporte_ti_session";

/** Convierte un texto (cabecera o parametro) en Panel, o null si no es valido. */
export function aPanel(valor: string | null | undefined): Panel | null {
  return valor === "admin" || valor === "soporte" ? valor : null;
}

/** Panel al que pertenece una ruta de pagina ("/admin/..." o "/soporte/..."). */
export function panelDeRuta(pathname: string): Panel {
  return pathname.startsWith("/admin") ? "admin" : "soporte";
}
