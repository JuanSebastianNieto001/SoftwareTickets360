// Estado de la cola de atencion: en que puesto queda un ticket y cuanto se
// estima que tardara su primera respuesta.
//
// A diferencia de src/lib/ticket.ts (que es puro y viaja al navegador), este
// archivo SI consulta la base, asi que solo puede importarse desde el
// servidor. La division es la misma que ya existia con src/lib/codigoTicket.ts.
import { prisma } from "@/lib/db";
import { describirEstimado, estaEnHorario, sumarMinutosHabiles } from "@/lib/horario";
import {
  MINUTOS_POR_TICKET_POR_DEFECTO,
  estimarPrimeraRespuesta,
  prioridadesSuperioresA,
  redondearEstimado,
  type Prioridad,
} from "@/lib/ticket";

export type EstadoCola = {
  /** Puesto del ticket entre los pendientes. 1 = es el siguiente en atenderse. */
  posicion: number;
  /** Total de tickets pendientes, incluido el propio. */
  enCola: number;
  /** Tickets que ya estan siendo atendidos: no estan en la cola, pero ocupan al tecnico. */
  enAtencion: number;
  /** Minutos de trabajo estimados hasta la primera respuesta, ya redondeados. */
  estimadoMinutos: number;
  /** Ese mismo estimado ya escrito para el usuario: "35 min" o "lunes 5 de octubre a las 8:30". */
  estimadoTexto: string;
  /** False si el ticket se radico fuera de la jornada: el reloj arranca en la siguiente apertura. */
  dentroDeHorario: boolean;
};

/**
 * Calcula la posicion en la cola y el estimado de primera respuesta.
 *
 * El orden de atencion que se asume aqui es el mismo que usa el panel de
 * admin para listar los pendientes (ver src/app/api/admin/tickets/route.ts):
 * primero la prioridad mas alta y, a igual prioridad, el que lleva mas
 * tiempo esperando. Si esos dos ordenes se separan, la posicion que se le
 * promete al usuario deja de ser cierta.
 */
export async function calcularEstadoCola(ticket: {
  id: string;
  prioridad: string;
  fechaCreacion: Date;
}): Promise<EstadoCola> {
  const prioridad = ticket.prioridad as Prioridad;
  const superiores = prioridadesSuperioresA(prioridad);

  const [delante, porEstado, historico] = await Promise.all([
    // Lo que se atiende antes que este ticket: cualquier pendiente de
    // prioridad mayor, o uno de la misma prioridad que llego primero.
    prisma.ticket.count({
      where: {
        estado: "PENDIENTE",
        id: { not: ticket.id },
        OR: [
          ...(superiores.length > 0 ? [{ prioridad: { in: superiores } }] : []),
          { prioridad, fechaCreacion: { lt: ticket.fechaCreacion } },
        ],
      },
    }),
    prisma.ticket.groupBy({
      by: ["estado"],
      where: { estado: { in: ["PENDIENTE", "EN_PROCESO"] } },
      _count: { _all: true },
    }),
    // Promedio real de lo que toma resolver un ticket: es la mejor pista que
    // hay de cuanto ocupa cada uno al tecnico. Con la base recien estrenada
    // (sin cerrados todavia) cae a la constante por defecto.
    prisma.ticket.aggregate({
      _avg: { tiempoResolucion: true },
      where: { estado: "CERRADO", tiempoResolucion: { not: null } },
    }),
  ]);

  const contar = (estado: string) =>
    porEstado.find((fila) => fila.estado === estado)?._count._all ?? 0;

  const enCola = contar("PENDIENTE");
  const enAtencion = contar("EN_PROCESO");
  const minutosPorTicket = historico._avg.tiempoResolucion ?? MINUTOS_POR_TICKET_POR_DEFECTO;

  const estimadoMinutos = redondearEstimado(
    estimarPrimeraRespuesta(prioridad, delante + enAtencion, minutosPorTicket)
  );

  // Los minutos estimados son de TRABAJO, no de reloj: el acta cuenta los
  // tiempos solo dentro de la jornada. Proyectarlos sobre el horario da la
  // fecha real en que le tocara el turno a este ticket.
  const fechaEstimada = sumarMinutosHabiles(ticket.fechaCreacion, estimadoMinutos);

  return {
    posicion: delante + 1,
    enCola,
    enAtencion,
    estimadoMinutos,
    estimadoTexto: describirEstimado(ticket.fechaCreacion, fechaEstimada, estimadoMinutos),
    dentroDeHorario: estaEnHorario(ticket.fechaCreacion),
  };
}
