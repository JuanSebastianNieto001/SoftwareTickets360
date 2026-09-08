import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
