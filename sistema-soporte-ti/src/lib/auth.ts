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
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "soporte_ti_session";
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

export type SesionPayload = {
  userId: string;
  correo: string;
  nombre: string;
};

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

export async function establecerCookieSesion(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true, // inaccesible desde JS del navegador: mitiga robo de token via XSS
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas, debe coincidir con DURACION_SESION
  });
}

export async function eliminarCookieSesion() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Lee y valida la cookie de sesion de la request actual (Server Component / Route Handler). */
export async function obtenerSesionActual(): Promise<SesionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verificarSesion(token);
}

export { COOKIE_NAME };
