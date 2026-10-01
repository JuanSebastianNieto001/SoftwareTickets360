import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crearSesion, establecerCookieSesion, verificarPassword, type Rol } from "@/lib/auth";
import { ACCIONES, registrar } from "@/lib/registro";
import { loginSchema } from "@/lib/validation";
import type { Panel } from "@/lib/panel";

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

  const { correo, password, panel: panelPedido } = parsed.data;

  const usuario = await prisma.user.findUnique({ where: { correo: correo.toLowerCase() } });
  if (!usuario) {
    return NextResponse.json({ error: "Correo o contrasena incorrectos" }, { status: 401 });
  }

  const passwordValida = await verificarPassword(password, usuario.passwordHash);
  if (!passwordValida) {
    return NextResponse.json({ error: "Correo o contrasena incorrectos" }, { status: 401 });
  }

  const sesion = {
    userId: usuario.id,
    correo: usuario.correo,
    nombre: usuario.nombre,
    rol: (usuario.rol === "ADMIN" ? "ADMIN" : "SOPORTE") as Rol,
  };

  // La sesion queda en la cookie del panel por el que se entro, asi no pisa
  // la de otra pestana abierta en el otro panel. Una cuenta de soporte que
  // entra por /admin/login queda en el de soporte: al de admin no tiene acceso.
  const panel: Panel = panelPedido === "admin" && sesion.rol === "ADMIN" ? "admin" : "soporte";

  const token = await crearSesion(sesion);
  await establecerCookieSesion(token, panel);

  await registrar(sesion, ACCIONES.INICIO_SESION, `Ingreso al panel como ${sesion.rol}`);

  // El panel viaja de vuelta para que el formulario redirija a donde quedo
  // la sesion.
  return NextResponse.json({ ok: true, nombre: usuario.nombre, rol: sesion.rol, panel });
}
