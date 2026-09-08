import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/tickets/:id — detalle de un ticket. Protegido por middleware.
//
// Existe para traer la solucion, que el listado (./../route.ts) no manda a
// proposito: es el campo mas pesado y solo se necesita cuando el
// administrador abre un ticket finalizado. Se pide una vez por ticket y el
// panel lo deja cacheado.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      codigoTicket: true,
      solucion: true,
      tiempoLlegada: true,
      tiempoResolucion: true,
      tiempoTotal: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}

// DELETE /api/admin/tickets/:id — elimina un ticket especifico. Protegido por middleware.
// No pide un parametro de confirmacion como el DELETE masivo de ./route.ts
// porque el "estas seguro" ya ocurre en el cliente (window.confirm en
// AdminDashboard.tsx) antes de disparar la request.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }

  await prisma.ticket.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true, codigoTicket: ticket.codigoTicket });
}
