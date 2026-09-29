import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { esAdmin, hashPassword, obtenerSesionActual } from "@/lib/auth";
import { ACCIONES, registrar } from "@/lib/registro";
import { restablecerPasswordSchema } from "@/lib/validation";

// POST /api/admin/usuarios/:id/password — el lider de TI le pone una
// contrasena nueva a una cuenta de soporte que la olvido.
//
// No pide la contrasena actual: quien la olvido no puede aportarla, y quien
// autoriza el cambio es el administrador, no el dueno de la cuenta.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesionActual();
  if (!esAdmin(sesion)) {
    return NextResponse.json(
      { error: "Solo el administrador puede restablecer contrasenas" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud invalido" }, { status: 400 });
  }

  const parsed = restablecerPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }

  const usuario = await prisma.user.findUnique({ where: { id: params.id } });
  if (!usuario) {
    return NextResponse.json({ error: "La cuenta no existe" }, { status: 404 });
  }

  // Un administrador no se restablece a si mismo desde aqui: para eso esta
  // el seed, y asi la bitacora no se llena de cambios sobre la propia cuenta.
  if (usuario.id === sesion?.userId) {
    return NextResponse.json(
      { error: "No puedes restablecer tu propia contrasena desde aqui" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: usuario.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });

  await registrar(
    sesion,
    ACCIONES.PASSWORD_RESTABLECIDA,
    `Restablecio la contrasena de ${usuario.nombre} (${usuario.correo})`
  );

  return NextResponse.json({ ok: true, nombre: usuario.nombre });
}
