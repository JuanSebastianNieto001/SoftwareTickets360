import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crearSesion, establecerCookieSesion, obtenerSesionActual } from "@/lib/auth";
import { actualizarNombreAdminSchema } from "@/lib/validation";

// PATCH /api/admin/perfil — cambia el nombre visible del administrador.
// Protegido por middleware.ts (la ruta cuelga de /api/admin), pero igual se
// vuelve a leer la sesion aqui porque se necesita el userId: el nombre se
// cambia SIEMPRE sobre el usuario de la cookie, nunca sobre un id que venga
// en el cuerpo, para que nadie pueda renombrar a otro admin.
//
// Ese nombre es el mismo que sale en el saludo del panel y, via la relacion
// admin -> Ticket, el que aparece como "Atendido por". Como los tickets
// guardan el id del admin y no una copia del nombre, al cambiarlo se
// actualizan tambien los tickets que ya estaban cerrados.
export async function PATCH(request: NextRequest) {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud invalido" }, { status: 400 });
  }

  const parsed = actualizarNombreAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos invalidos" },
      { status: 400 }
    );
  }

  let usuario;
  try {
    usuario = await prisma.user.update({
      where: { id: sesion.userId },
      data: { nombre: parsed.data.nombre },
      select: { id: true, nombre: true, correo: true },
    });
  } catch {
    // Practicamente solo pasa si el usuario de la cookie ya no existe en la
    // base (por ejemplo, se reseteo la base con una sesion abierta).
    return NextResponse.json({ error: "No se pudo guardar el nombre" }, { status: 500 });
  }

  // El nombre viaja DENTRO del JWT de sesion, asi que hay que volver a
  // firmar la cookie: si no, el saludo seguiria mostrando el anterior hasta
  // el proximo login. Esto reinicia las 8h de la sesion, lo cual es correcto
  // porque el admin acaba de interactuar con el panel.
  const token = await crearSesion({
    userId: usuario.id,
    correo: usuario.correo,
    nombre: usuario.nombre,
  });
  await establecerCookieSesion(token);

  return NextResponse.json({ ok: true, nombre: usuario.nombre });
}
