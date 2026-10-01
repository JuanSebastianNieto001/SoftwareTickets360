import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { esAdmin, obtenerSesionActual } from "@/lib/auth";
import { borrarFinalizadosSchema } from "@/lib/validation";
import { ACCIONES, registrar } from "@/lib/registro";
import { ORDEN_PRIORIDAD } from "@/lib/ticket";

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
  // Los dos tiempos que compara el SLA: llegada (creacion -> "Voy en camino")
  // y resolucion ("Voy en camino" -> cierre). Son dos enteros, no pesan, y
  // con ellos el panel evalua el cumplimiento sin una consulta extra.
  tiempoLlegada: true,
  tiempoResolucion: true,
  admin: { select: { nombre: true } },
} as const;

// GET /api/admin/tickets?estado=ACTIVOS — listado para el panel. Protegido por middleware.
//
// ACTIVOS son los que siguen abiertos: pendientes MAS en proceso. Al marcar
// "Voy en camino" el ticket no se va de esta vista, solo cambia de aspecto
// (ver AdminDashboard), porque quien lo tomo necesita seguirlo viendo hasta
// cerrarlo sin cambiar de pestana. Tambien aparece en "En proceso", que sirve
// para mirar solo los que ya estan en curso.
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
    // Los finalizados se ordenan por cierre mas reciente (es un historial).
    if (a.estado === "CERRADO" && b.estado === "CERRADO") {
      return (b.fechaCierre?.getTime() ?? 0) - (a.fechaCierre?.getTime() ?? 0);
    }
    // Los pendientes salen en el MISMO orden que se le prometio a quien
    // radico el ticket (ver src/lib/cola.ts): primero la prioridad mas alta
    // y, a igual prioridad, el que lleva mas tiempo esperando. Si este orden
    // y el de la cola se separan, la posicion que se le mostro al usuario
    // deja de ser cierta.
    if (a.estado === "PENDIENTE" && b.estado === "PENDIENTE") {
      const diffPrioridad =
        (ORDEN_PRIORIDAD[a.prioridad as keyof typeof ORDEN_PRIORIDAD] ?? 99) -
        (ORDEN_PRIORIDAD[b.prioridad as keyof typeof ORDEN_PRIORIDAD] ?? 99);
      if (diffPrioridad !== 0) return diffPrioridad;
      return a.fechaCreacion.getTime() - b.fechaCreacion.getTime();
    }
    // Los que ya estan en proceso, por creacion mas reciente.
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

// DELETE /api/admin/tickets?confirmacion=ELIMINAR — borra los tickets
// FINALIZADOS. Exige el parametro de confirmacion exacto para evitar
// borrados accidentales.
//
// Cuerpo opcional: { "conservar": ["id1", "id2"] }. Esos finalizados se
// salvan del borrado. Existe porque el vaciado se hace por periodos (por
// ejemplo, los de septiembre el 1 de octubre) y los que se cerraron en el
// periodo nuevo no deberian irse con los viejos.
//
// A proposito no borra los tickets abiertos: son trabajo pendiente y ademas
// no salen en el Excel (que exporta solo finalizados), asi que borrarlos
// aqui los haria desaparecer sin ningun respaldo. Para eliminar uno abierto
// esta el borrado individual, que es una decision consciente sobre un
// ticket concreto.
export async function DELETE(request: NextRequest) {
  // Solo el lider de TI. Es la operacion mas destructiva del sistema, y el
  // middleware solo comprueba que haya sesion: el rol se verifica aqui.
  const sesion = await obtenerSesionActual();
  if (!esAdmin(sesion)) {
    return NextResponse.json(
      { error: "Solo el administrador puede borrar tickets" },
      { status: 403 }
    );
  }

  const confirmacion = request.nextUrl.searchParams.get("confirmacion");
  if (confirmacion !== "ELIMINAR") {
    return NextResponse.json(
      { error: "Falta la confirmacion. Agrega ?confirmacion=ELIMINAR a la solicitud." },
      { status: 400 }
    );
  }

  // Sin cuerpo (o vacio) se borran todos los finalizados, como antes.
  let conservar: string[] = [];
  const texto = await request.text();
  if (texto.trim()) {
    const parsed = borrarFinalizadosSchema.safeParse(safeJson(texto));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Lista de tickets a conservar invalida" },
        { status: 400 }
      );
    }
    conservar = parsed.data.conservar;
  }

  const resultado = await prisma.ticket.deleteMany({
    where: {
      estado: "CERRADO",
      ...(conservar.length > 0 ? { id: { notIn: conservar } } : {}),
    },
  });

  await registrar(
    sesion,
    ACCIONES.TICKETS_ELIMINADOS,
    `Borrado masivo: elimino ${resultado.count} tickets finalizados` +
      (conservar.length > 0 ? ` y conservo ${conservar.length} marcados a mano` : "")
  );

  return NextResponse.json({
    eliminados: resultado.count,
    mensaje: `Se eliminaron ${resultado.count} tickets finalizados.`,
  });
}

/** JSON.parse que devuelve undefined en vez de lanzar, para que Zod responda el 400. */
function safeJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}
