// Guardia de rutas. Hay dos paneles, cada uno con su URL y su login:
//
//   /soporte  -> quien atiende los tickets. Requiere sesion valida.
//   /admin    -> el lider de TI. Requiere ademas rol ADMIN.
//
// Las dos exigen autenticarse cada vez que la sesion expira (8h) o se
// cierra: no hay forma de entrar sin pasar por el login.
//
// Duplica la verificacion de jose/JWT que ya existe en src/lib/auth.ts en
// vez de importarla porque el middleware de Next.js corre en el Edge
// Runtime, que no soporta todas las APIs de Node que usa el resto de la
// app (por ejemplo bcryptjs). Si cambias el algoritmo, el secreto de firma
// o el payload en auth.ts, replica el cambio aqui tambien.
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "soporte_ti_session";

type Sesion = { rol?: string };

/** Devuelve el payload si el token es valido, o null. Nunca lanza. */
async function leerSesion(token: string | undefined): Promise<Sesion | null> {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as Sesion;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const esLogin = pathname === "/admin/login" || pathname === "/soporte/login";
  if (esLogin) return NextResponse.next();

  const esPanelAdmin = pathname.startsWith("/admin");
  const esPanelSoporte = pathname.startsWith("/soporte");
  const esApi = pathname.startsWith("/api/admin");

  if (!esPanelAdmin && !esPanelSoporte && !esApi) return NextResponse.next();

  const sesion = await leerSesion(request.cookies.get(COOKIE_NAME)?.value);

  if (!sesion) {
    if (esApi) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    // Cada panel manda a su propio login, y se recuerda a donde iba.
    const loginUrl = new URL(esPanelAdmin ? "/admin/login" : "/soporte/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // El panel del lider exige rol ADMIN. Un soporte con sesion valida que
  // intente entrar ahi termina en su propio panel, no en un error.
  if (esPanelAdmin && sesion.rol !== "ADMIN") {
    return NextResponse.redirect(new URL("/soporte", request.url));
  }

  // Las rutas /api/admin solo exigen sesion aqui: cuales son exclusivas del
  // administrador (borrar, cuentas, bitacora) lo decide cada handler, que es
  // donde esta el contexto para responder 403 con sentido.
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/soporte/:path*", "/api/admin/:path*"],
};
