import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Orden de la vista de admin: tickets activos (nuevos primero) arriba,
// los ya cerrados abajo. Se ordena en JS despues del fetch (no con
// `orderBy` de Prisma) porque `estado` es un String plano, no un enum
// nativo de Postgres (ver comentario en prisma/schema.prisma), asi que
// Prisma no tiene forma de ordenar por una secuencia custom como esta sin
// caer a SQL crudo.
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
              { numeroPuesto: { contains: busqueda } },
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

  // Los contadores se calculan sobre TODA la tabla, no sobre `tickets`, que
  // ya viene filtrado: si no, al filtrar por "Pendientes" los otros dos
  // contadores mostrarian 0 aunque haya tickets en esos estados.
  const conteoPorEstado = await prisma.ticket.groupBy({
    by: ["estado"],
    _count: { _all: true },
  });

  const contadores = { PENDIENTE: 0, EN_PROCESO: 0, CERRADO: 0 };
  for (const fila of conteoPorEstado) {
    if (fila.estado in contadores) {
      contadores[fila.estado as keyof typeof contadores] = fila._count._all;
    }
  }

  return NextResponse.json({ tickets, contadores });
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
