import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularEstadoCola } from "@/lib/cola";
import { generarCodigoTicket } from "@/lib/codigoTicket";
import { prioridadParaTicket } from "@/lib/ticket";
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
      alcance: data.alcance,
      descripcion: data.descripcion,
      // La prioridad no la elige quien reporta: sale de la categoria y del
      // alcance de la falla (ver prioridadParaTicket).
      prioridad: prioridadParaTicket(data.categoria, data.alcance),
      estado: "PENDIENTE",
    },
  });

  // Se calcula DESPUES de crear el ticket, para que la posicion lo incluya a
  // el y no quede desfasada respecto a lo que vera el administrador.
  const cola = await calcularEstadoCola(ticket);

  return NextResponse.json(
    {
      codigoTicket: ticket.codigoTicket,
      prioridad: ticket.prioridad,
      cola,
      mensaje: "Ticket creado correctamente. Guarda tu codigo para hacerle seguimiento.",
    },
    { status: 201 }
  );
}
