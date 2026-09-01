import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Orden de la vista de admin: tickets activos (nuevos primero) arriba,
// los ya cerrados abajo.
const ORDEN_ESTADO: Record<string, number> = { PENDIENTE: 0, EN_PROCESO: 1, CERRADO: 2 };

// GET /api/admin/tickets?estado=PENDIENTE — listado para el panel. Protegido por middleware.
export async function GET(request: NextRequest) {
  const estado = request.nextUrl.searchParams.get("estado");
  const busqueda = request.nextUrl.searchParams.get("q")?.trim();

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(estado && ["PENDIENTE", "EN_PROCESO", "CERRADO"].includes(estado)
        ? { estado: estado as "PENDIENTE" | "EN_PROCESO" | "CERRADO" }
        : {}),
      ...(busqueda
        ? {
            OR: [
              { codigoTicket: { contains: busqueda } },
              { nombreSolicitante: { contains: busqueda } },
              { area: { contains: busqueda } },
            ],
          }
        : {}),
    },
    include: { admin: { select: { nombre: true } } },
  });

  tickets.sort((a, b) => {
    const diffEstado = (ORDEN_ESTADO[a.estado] ?? 99) - (ORDEN_ESTADO[b.estado] ?? 99);
    if (diffEstado !== 0) return diffEstado;
    return b.fechaCreacion.getTime() - a.fechaCreacion.getTime();
  });

  return NextResponse.json({ tickets });
}

// DELETE /api/admin/tickets?confirmacion=ELIMINAR — borra TODOS los tickets de la base de datos.
// Exige el parametro de confirmacion exacto para evitar borrados accidentales.
export async function DELETE(request: NextRequest) {
  const confirmacion = request.nextUrl.searchParams.get("confirmacion");
  if (confirmacion !== "ELIMINAR") {
    return NextResponse.json(
      { error: "Falta la confirmacion. Agrega ?confirmacion=ELIMINAR a la solicitud." },
      { status: 400 }
    );
  }

  const resultado = await prisma.ticket.deleteMany({});

  return NextResponse.json({
    eliminados: resultado.count,
    mensaje: `Se eliminaron ${resultado.count} tickets.`,
  });
}
