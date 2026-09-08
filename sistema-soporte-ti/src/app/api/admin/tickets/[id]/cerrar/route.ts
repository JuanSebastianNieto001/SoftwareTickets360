import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obtenerSesionActual } from "@/lib/auth";
import { cerrarTicketSchema } from "@/lib/validation";

// POST /api/admin/tickets/:id/cerrar — cierra el ticket registrando la solucion y los tiempos finales.
export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  const parsed = cerrarTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }
  if (ticket.estado === "CERRADO") {
    return NextResponse.json({ error: "El ticket ya esta cerrado" }, { status: 409 });
  }

  // Normalmente el ticket ya paso por /iniciar (RF-05, "Voy en camino") y
  // trae fechaInicio + tiempoLlegada calculados. Pero el admin puede cerrar
  // un ticket PENDIENTE directamente sin pasar por ese paso, asi que aqui
  // se cubre ese caso: si no hay fechaInicio, se usa el cierre como inicio
  // (tiempo de resolucion = 0) y la llegada se calcula sobre la marcha.
  const ahora = new Date();
  const inicioParaCalculo = ticket.fechaInicio ?? ticket.fechaCreacion;
  const tiempoResolucion = Math.max(0, Math.round((ahora.getTime() - inicioParaCalculo.getTime()) / 60000));
  const tiempoTotal = Math.max(0, Math.round((ahora.getTime() - ticket.fechaCreacion.getTime()) / 60000));
  const tiempoLlegada =
    ticket.tiempoLlegada ??
    (ticket.fechaInicio
      ? Math.max(0, Math.round((ticket.fechaInicio.getTime() - ticket.fechaCreacion.getTime()) / 60000))
      : 0);

  const actualizado = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      estado: "CERRADO",
      fechaInicio: ticket.fechaInicio ?? ahora,
      fechaCierre: ahora,
      tiempoLlegada,
      tiempoResolucion,
      tiempoTotal,
      solucion: parsed.data.solucion,
      adminId: ticket.adminId ?? sesion.userId,
    },
  });

  return NextResponse.json({ ticket: actualizado });
}
