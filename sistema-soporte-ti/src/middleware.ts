// Guardia de rutas: protege /admin (menos /admin/login) y /api/admin/*
// exigiendo una cookie de sesion con JWT valido.
//
// Duplica la verificacion de jose/JWT que ya existe en src/lib/auth.ts en
// vez de importarla porque el middleware de Next.js corre en el Edge
// Runtime, que no soporta todas las APIs de Node que usa el resto de la
// app (por ejemplo bcryptjs). Si cambias el algoritmo o el secreto de
// firma en auth.ts, replica el cambio aqui tambien.
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "soporte_ti_session";

async function haySesionValida(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const esRutaProtegida =
    (pathname.startsWith("/admin") && pathname !== "/admin/login") ||
    pathname.startsWith("/api/admin");

  if (!esRutaProtegida) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valida = await haySesionValida(token);

  if (!valida) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
