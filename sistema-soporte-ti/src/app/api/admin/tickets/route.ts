import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Orden de la vista de admin: dentro de los activos, primero los pendientes
// y luego los que ya estan en proceso. Se ordena en JS despues del fetch (no
// con `orderBy` de Prisma) porque `estado` es un String plano, no un enum
// nativo de Postgres (ver comentario en prisma/schema.prisma), asi que
// Prisma no tiene forma de ordenar por una secuencia custom como esta sin
// caer a SQL crudo.
const ORDEN_ESTADO: Record<string, number> = { PENDIENTE: 0, EN_PROCESO: 1, CERRADO: 2 };

// Campos que necesita la tarjeta del listado. Se piden explicitamente para
// NO traer `solucion`, que es un texto largo y solo se ve al abrir un ticket
// finalizado: con el polling cada pocos segundos, mandarla en cada respuesta
// multiplicaba el trafico sin que nadie la estuviera leyendo.
// La solucion se pide aparte en GET /api/admin/tickets/:id.
const CAMPOS_LISTADO = {
  id: true,
  codigoTicket: true,
  nombreSolicitante: true,
  numeroPuesto: true,
  area: true,
  teamLeader: true,
  categoria: true,
  descripcion: true,
  estado: true,
  prioridad: true,
  fechaCreacion: true,
  fechaInicio: true,
  fechaCierre: true,
  tiempoResolucion: true,
  admin: { select: { nombre: true } },
} as const;

// GET /api/admin/tickets?estado=ACTIVOS — listado para el panel. Protegido por middleware.
//
// `estado` acepta ACTIVOS (pendientes + en proceso, que es la vista inicial),
// o uno de PENDIENTE / EN_PROCESO / CERRADO. Sin parametro trae todo.
export async function GET(request: NextRequest) {
  const estado = request.nextUrl.searchParams.get("estado");
  const busqueda = request.nextUrl.searchParams.get("q")?.trim();
  const teamLeader = request.nextUrl.searchParams.get("teamLeader")?.trim();

  const filtroEstado =
    estado === "ACTIVOS"
      ? { estado: { in: ["PENDIENTE", "EN_PROCESO"] } }
      : estado && ["PENDIENTE", "EN_PROCESO", "CERRADO"].includes(estado)
        ? { estado }
        : {};

  const tickets = await prisma.ticket.findMany({
    where: {
      ...filtroEstado,
      ...(teamLeader ? { teamLeader } : {}),
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
    select: CAMPOS_LISTADO,
  });

  tickets.sort((a, b) => {
    const diffEstado = (ORDEN_ESTADO[a.estado] ?? 99) - (ORDEN_ESTADO[b.estado] ?? 99);
    if (diffEstado !== 0) return diffEstado;
    // Los finalizados se ordenan por cierre mas reciente (es un historial);
    // los activos, por creacion mas reciente.
    if (a.estado === "CERRADO" && b.estado === "CERRADO") {
      return (b.fechaCierre?.getTime() ?? 0) - (a.fechaCierre?.getTime() ?? 0);
    }
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

  // Tickets por team leader sobre toda la tabla (no sobre el filtro actual):
  // es justamente para comparar entre lideres. Los tickets sin leader
  // (area Administrativos) quedan fuera.
  const conteoPorLider = await prisma.ticket.groupBy({
    by: ["teamLeader"],
    where: { teamLeader: { not: "" } },
    _count: { _all: true },
  });

  const porTeamLeader = Object.fromEntries(
    conteoPorLider.map((fila) => [fila.teamLeader, fila._count._all])
  );

  return NextResponse.json({ tickets, contadores, porTeamLeader });
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
