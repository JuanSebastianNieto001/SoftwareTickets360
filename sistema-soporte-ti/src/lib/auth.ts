// Autenticacion del panel de administrador.
//
// No usamos un proveedor externo (NextAuth, Supabase Auth, etc): el sistema
// solo tiene un tipo de usuario autenticado (el admin), asi que basta con
// una sesion propia hecha de dos piezas:
//   1) bcrypt para guardar el hash de la contrasena (nunca texto plano).
//   2) un JWT firmado (jose) guardado en una cookie httpOnly como prueba de sesion.
//
// middleware.ts hace la MISMA verificacion de JWT (sin poder usar este
// modulo directamente por las limitaciones del Edge Runtime), asi que si
// cambias el algoritmo o el payload aqui, replica el cambio alli tambien.
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { CABECERA_PANEL, COOKIE_LEGADA, aPanel, cookieDePanel, type Panel } from "@/lib/panel";

const DURACION_SESION = "8h";

// AUTH_SECRET firma y verifica el JWT de sesion. Debe ser el mismo valor en
// todos los entornos donde corra la app (local y Vercel) o las sesiones
// creadas en uno no seran validas en el otro.
function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Falta AUTH_SECRET en las variables de entorno (.env)");
  }
  return new TextEncoder().encode(secret);
}

/** Perfiles del sistema. ADMIN es el lider de TI; SOPORTE, quien atiende. */
export const ROLES = ["ADMIN", "SOPORTE"] as const;
export type Rol = (typeof ROLES)[number];

export type SesionPayload = {
  userId: string;
  correo: string;
  nombre: string;
  rol: Rol;
};

/**
 * Solo el administrador puede borrar tickets, gestionar cuentas y leer la
 * bitacora. El soporte atiende y consulta, pero no destruye nada.
 *
 * Se compara contra el rol que viene FIRMADO en el JWT, no contra uno que
 * mande el cliente: el token no se puede alterar sin AUTH_SECRET.
 */
export function esAdmin(sesion: SesionPayload | null): boolean {
  return sesion?.rol === "ADMIN";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verificarPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Firma un JWT con los datos del admin. Expira solo en 8h (ver DURACION_SESION). */
export async function crearSesion(payload: SesionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DURACION_SESION)
    .sign(getSecretKey());
}

/** Valida firma y expiracion del JWT. Devuelve null (nunca lanza) si el token es invalido. */
export async function verificarSesion(token: string): Promise<SesionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SesionPayload;
  } catch {
    return null;
  }
}

/** Guarda la sesion en la cookie del panel indicado, sin tocar la del otro. */
export async function establecerCookieSesion(token: string, panel: Panel) {
  const store = await cookies();
  // La cookie unica de la version anterior ya no se lee; se limpia para que
  // no quede un token huerfano en el navegador.
  store.delete(COOKIE_LEGADA);
  store.set(cookieDePanel(panel), token, {
    httpOnly: true, // inaccesible desde JS del navegador: mitiga robo de token via XSS
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas, debe coincidir con DURACION_SESION
  });
}

/** Cierra la sesion de un solo panel: la pestana del otro sigue abierta. */
export async function eliminarCookieSesion(panel: Panel) {
  const store = await cookies();
  store.delete(cookieDePanel(panel));
}

/** Panel desde el que llama el navegador (cabecera x-panel), o null si no la mando. */
export async function panelDeLaPeticion(): Promise<Panel | null> {
  const store = await headers();
  return aPanel(store.get(CABECERA_PANEL));
}

async function leerCookie(panel: Panel): Promise<SesionPayload | null> {
  const store = await cookies();
  const token = store.get(cookieDePanel(panel))?.value;
  return token ? verificarSesion(token) : null;
}

/**
 * Lee y valida la sesion de la request actual (Server Component / Route Handler).
 *
 * Las paginas pasan su panel explicito. Las rutas de la API lo toman de la
 * cabecera x-panel que agrega el navegador (ver useApiPanel).
 *
 * Si no se sabe el panel, se prueba primero la sesion de SOPORTE: es la de
 * menos permisos, asi que una llamada sin cabecera nunca termina actuando
 * como administrador por accidente. Solo si no hay sesion de soporte se usa
 * la de admin.
 */
export async function obtenerSesionActual(panel?: Panel): Promise<SesionPayload | null> {
  const elegido = panel ?? (await panelDeLaPeticion());
  if (elegido) return leerCookie(elegido);
  return (await leerCookie("soporte")) ?? (await leerCookie("admin"));
}

/**
 * Sesion para las acciones exclusivas del lider de TI: borrar tickets,
 * gestionar cuentas, leer la bitacora y la limpieza.
 *
 * Exige DOS cosas: que la peticion venga del panel del lider (cabecera
 * x-panel: admin) y que la sesion de ese panel sea de rol ADMIN. No basta el
 * rol: el panel de soporte nunca borra, aunque quien haya entrado ahi sea una
 * cuenta de administrador. Asi las dos pestanas tienen permisos distintos de
 * verdad, y no depende de que la interfaz esconda los botones.
 *
 * Devuelve null si no se cumple; la ruta responde 403.
 */
export async function obtenerSesionAdministrador(): Promise<SesionPayload | null> {
  if ((await panelDeLaPeticion()) !== "admin") return null;
  const sesion = await leerCookie("admin");
  return esAdmin(sesion) ? sesion : null;
}
