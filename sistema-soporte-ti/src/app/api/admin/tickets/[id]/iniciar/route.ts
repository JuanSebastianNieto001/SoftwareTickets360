import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obtenerSesionActual } from "@/lib/auth";

// POST /api/admin/tickets/:id/iniciar — el administrador marca "Voy en camino".
// Cambia el estado a EN_PROCESO y registra fechaInicio + tiempoLlegada.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }
  if (ticket.estado !== "PENDIENTE") {
    return NextResponse.json({ error: "El ticket ya fue iniciado o esta cerrado" }, { status: 409 });
  }

  const ahora = new Date();
  const tiempoLlegada = Math.max(0, Math.round((ahora.getTime() - ticket.fechaCreacion.getTime()) / 60000));

  const actualizado = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      estado: "EN_PROCESO",
      fechaInicio: ahora,
      tiempoLlegada,
      adminId: sesion.userId,
    },
  });

  return NextResponse.json({ ticket: actualizado });
}
