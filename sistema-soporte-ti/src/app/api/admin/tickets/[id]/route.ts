import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { esAdmin, obtenerSesionActual } from "@/lib/auth";
import { ACCIONES, registrar } from "@/lib/registro";

// GET /api/admin/tickets/:id — detalle de un ticket. Protegido por middleware.
//
// Existe para traer la solucion, que el listado (./../route.ts) no manda a
// proposito: es el campo mas pesado y solo se necesita cuando el
// administrador abre un ticket finalizado. Se pide una vez por ticket y el
// panel lo deja cacheado.
//
// La justificacion del SLA viaja por aqui por lo mismo: es otro texto largo,
// esta vacia en la mayoria de los tickets (los que cumplieron la meta) y solo
// se lee al abrir el que quedo fuera.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      codigoTicket: true,
      solucion: true,
      justificacionSla: true,
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

// DELETE /api/admin/tickets/:id — elimina un ticket especifico.
//
// Solo el lider de TI (rol ADMIN). El soporte atiende y consulta, pero no
// borra: el middleware deja pasar a cualquier sesion valida, asi que la
// restriccion real se verifica aqui, contra el rol firmado en el JWT.
//
// No pide un parametro de confirmacion como el DELETE masivo de ./route.ts
// porque el "estas seguro" ya ocurre en el cliente (window.confirm en
// AdminDashboard.tsx) antes de disparar la request.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesionActual();
  if (!esAdmin(sesion)) {
    return NextResponse.json(
      { error: "Solo el administrador puede eliminar tickets" },
      { status: 403 }
    );
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }

  await prisma.ticket.delete({ where: { id: params.id } });

  await registrar(
    sesion,
    ACCIONES.TICKET_ELIMINADO,
    `Elimino el ticket de ${ticket.nombreSolicitante} (${ticket.categoria})`,
    ticket.codigoTicket
  );

  return NextResponse.json({ ok: true, codigoTicket: ticket.codigoTicket });
}
