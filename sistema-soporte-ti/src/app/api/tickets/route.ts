import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generarCodigoTicket } from "@/lib/codigoTicket";
import { prioridadParaCategoria } from "@/lib/ticket";
import { crearTicketSchema } from "@/lib/validation";

// POST /api/tickets — creacion publica de un ticket. No requiere autenticacion.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud invalido" }, { status: 400 });
  }

  const parsed = crearTicketSchema.safeParse(body);
  if (!parsed.success) {
    const primerError = parsed.error.errors[0]?.message ?? "Datos invalidos";
    return NextResponse.json({ error: primerError }, { status: 400 });
  }

  const data = parsed.data;
  const codigoTicket = await generarCodigoTicket();

  const ticket = await prisma.ticket.create({
    data: {
      codigoTicket,
      nombreSolicitante: data.nombreSolicitante,
      numeroPuesto: data.numeroPuesto,
      area: data.area,
      // Ya viene normalizado por el schema: "" si el area no es Asesor.
      teamLeader: data.teamLeader,
      categoria: data.categoria,
      descripcion: data.descripcion,
      // La prioridad no la elige quien reporta: sale de la categoria.
      prioridad: prioridadParaCategoria(data.categoria),
      estado: "PENDIENTE",
    },
  });

  return NextResponse.json(
    {
      codigoTicket: ticket.codigoTicket,
      mensaje: "Ticket creado correctamente. Guarda tu codigo para hacerle seguimiento.",
    },
    { status: 201 }
  );
}
