import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { esAdmin, hashPassword, obtenerSesionActual } from "@/lib/auth";
import { ACCIONES, registrar } from "@/lib/registro";
import { crearUsuarioSchema } from "@/lib/validation";

// Cuentas del sistema. Solo el lider de TI (rol ADMIN) las ve y las crea:
// el middleware deja pasar cualquier sesion valida a /api/admin, asi que la
// restriccion de rol se verifica aqui, contra el rol firmado en el JWT.
//
// El hash de la contrasena NUNCA sale en las respuestas.

/** 403 si quien llama no es administrador. Devuelve la sesion si si lo es. */
async function exigirAdmin() {
  const sesion = await obtenerSesionActual();
  if (!esAdmin(sesion)) return null;
  return sesion;
}

// GET /api/admin/usuarios — listado de cuentas con su actividad.
export async function GET() {
  const sesion = await exigirAdmin();
  if (!sesion) {
    return NextResponse.json({ error: "Solo el administrador puede ver las cuentas" }, { status: 403 });
  }

  const usuarios = await prisma.user.findMany({
    select: {
      id: true,
      nombre: true,
      correo: true,
      rol: true,
      creadoEn: true,
      // Cuantos tickets ha atendido cada quien: es la respuesta a "que
      // soporte hizo que", resumida.
      _count: { select: { ticketsAtendidos: true } },
    },
    orderBy: { creadoEn: "asc" },
  });

  return NextResponse.json({
    usuarios: usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      correo: u.correo,
      rol: u.rol,
      creadoEn: u.creadoEn,
      ticketsAtendidos: u._count.ticketsAtendidos,
      // Se marca la propia cuenta para que la interfaz no ofrezca
      // restablecerse la contrasena a uno mismo desde aqui.
      esTuCuenta: u.id === sesion.userId,
    })),
  });
}

// POST /api/admin/usuarios — crea una cuenta de soporte.
//
// Siempre con rol SOPORTE: no hay forma de crear otro administrador desde
// la interfaz. Un segundo admin se siembra con el seed, deliberadamente,
// para que nadie pueda escalar privilegios desde el panel.
export async function POST(request: NextRequest) {
  const sesion = await exigirAdmin();
  if (!sesion) {
    return NextResponse.json({ error: "Solo el administrador puede crear cuentas" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud invalido" }, { status: 400 });
  }

  const parsed = crearUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }

  const { nombre, correo, password } = parsed.data;

  const existente = await prisma.user.findUnique({ where: { correo } });
  if (existente) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese correo" }, { status: 409 });
  }

  const usuario = await prisma.user.create({
    data: { nombre, correo, passwordHash: await hashPassword(password), rol: "SOPORTE" },
    select: { id: true, nombre: true, correo: true, rol: true, creadoEn: true },
  });

  await registrar(
    sesion,
    ACCIONES.USUARIO_CREADO,
    `Creo la cuenta de soporte de ${usuario.nombre} (${usuario.correo})`
  );

  return NextResponse.json({ usuario }, { status: 201 });
}
