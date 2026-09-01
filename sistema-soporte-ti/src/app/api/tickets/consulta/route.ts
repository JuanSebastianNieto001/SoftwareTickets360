import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/tickets/consulta?codigo=TCK-000001 — seguimiento publico de un ticket por su codigo.
export async function GET(request: NextRequest) {
  const codigo = request.nextUrl.searchParams.get("codigo")?.trim().toUpperCase();
  if (!codigo) {
    return NextResponse.json({ error: "Falta el parametro codigo" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { codigoTicket: codigo },
    select: {
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

  return NextResponse.json({ ticket });
}
