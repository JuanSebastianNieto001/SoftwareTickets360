import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE /api/admin/tickets/:id — elimina un ticket especifico. Protegido por middleware.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }

  await prisma.ticket.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true, codigoTicket: ticket.codigoTicket });
}
