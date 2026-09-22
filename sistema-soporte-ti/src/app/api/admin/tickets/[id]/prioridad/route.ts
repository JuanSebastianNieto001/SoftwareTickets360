import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obtenerSesionActual } from "@/lib/auth";
import { cambiarPrioridadSchema } from "@/lib/validation";

// PATCH /api/admin/tickets/:id/prioridad — el administrador ajusta la
// prioridad de un ticket abierto.
//
// Existe por CRITICA: esa prioridad se define por el alcance del impacto
// ("detiene un area completa, mas de 10 personas"), no por la categoria del
// problema, asi que PRIORIDAD_POR_CATEGORIA no puede deducirla y el
// formulario publico tampoco la pregunta (si lo hiciera, cualquiera marcaria
// su caso como critico para saltarse la fila). El unico que puede juzgar el
// alcance es quien atiende, ya con el ticket en la mano.
//
// Sirve igual para bajar una prioridad mal asignada por la categoria.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  const parsed = cambiarPrioridadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }

  // En un ticket cerrado la prioridad ya no es una decision de atencion sino
  // la vara con la que se midio su SLA. Cambiarla reescribiria el veredicto
  // de un caso que ya paso (y dejaria una justificacion guardada sin
  // incumplimiento que la explique).
  if (ticket.estado === "CERRADO") {
    return NextResponse.json(
      { error: "No se puede cambiar la prioridad de un ticket ya cerrado" },
      { status: 409 }
    );
  }

  const actualizado = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { prioridad: parsed.data.prioridad },
  });

  return NextResponse.json({ ticket: actualizado });
}
