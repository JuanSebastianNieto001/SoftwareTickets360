import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crearSesion, establecerCookieSesion, verificarPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

// POST /api/auth/login — unico punto de entrada de autenticacion del panel.
// Usuario y contrasena incorrectos devuelven el MISMO mensaje de error (no
// se distingue "usuario no existe" de "contrasena incorrecta") para no darle
// pistas a quien intente adivinar credenciales por fuerza bruta.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud invalido" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }

  const { correo, password } = parsed.data;

  const usuario = await prisma.user.findUnique({ where: { correo: correo.toLowerCase() } });
  if (!usuario) {
    return NextResponse.json({ error: "Correo o contrasena incorrectos" }, { status: 401 });
  }

  const passwordValida = await verificarPassword(password, usuario.passwordHash);
  if (!passwordValida) {
    return NextResponse.json({ error: "Correo o contrasena incorrectos" }, { status: 401 });
  }

  const token = await crearSesion({ userId: usuario.id, correo: usuario.correo, nombre: usuario.nombre });
  await establecerCookieSesion(token);

  return NextResponse.json({ ok: true, nombre: usuario.nombre });
}
