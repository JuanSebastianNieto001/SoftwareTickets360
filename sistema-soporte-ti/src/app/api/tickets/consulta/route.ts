import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularEstadoCola } from "@/lib/cola";

// GET /api/tickets/consulta?codigo=TCK-000001 — seguimiento publico de un ticket por su codigo.
export async function GET(request: NextRequest) {
  const codigo = request.nextUrl.searchParams.get("codigo")?.trim().toUpperCase();
  if (!codigo) {
    return NextResponse.json({ error: "Falta el parametro codigo" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { codigoTicket: codigo },
    select: {
      id: true,
      codigoTicket: true,
      estado: true,
      categoria: true,
      area: true,
      prioridad: true,
      fechaCreacion: true,
      fechaInicio: true,
      fechaCierre: true,
      tiempoLlegada: true,
      tiempoResolucion: true,
      tiempoTotal: true,
      solucion: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "No existe un ticket con ese codigo" }, { status: 404 });
  }

  // Solo los pendientes estan en la cola. Se recalcula en cada consulta, asi
  // que la posicion avanza a medida que se atienden los de delante.
  const cola =
    ticket.estado === "PENDIENTE" ? await calcularEstadoCola(ticket, new Date()) : null;

  // El id interno sirve para el calculo, pero no se expone en la consulta publica.
  const { id: _id, ...publico } = ticket;

  return NextResponse.json({ ticket: publico, cola });
}
