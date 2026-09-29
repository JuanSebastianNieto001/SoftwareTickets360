// Horario laboral de la compania. Existe por el numeral 7 del Acta N.o 002:
// "los tiempos se cuentan unicamente dentro del horario laboral establecido
// por la compania, a partir del momento de radicacion del ticket".
//
// Sin esto, un ticket radicado un viernes a las 6 p.m. mostraria un estimado
// de "35 min" como si hubiera alguien atendiendo a esa hora.
//
// Modulo puro (no toca la base de datos), asi que lo pueden usar tanto las
// API routes como los componentes de cliente.
import { formatearMinutos } from "@/lib/ticket";

// Zona fija UTC-5 (America/Bogota). Colombia no aplica horario de verano,
// asi que el desfase es constante todo el ano. Se usa un offset explicito y
// no la hora local del proceso porque en Vercel el servidor corre en UTC.
const ZONA = "America/Bogota";
const OFFSET_BOGOTA_MINUTOS = -5 * 60;

/** Dias laborables, en la numeracion de getUTCDay: 0 domingo ... 6 sabado. */
export const DIAS_LABORABLES = [1, 2, 3, 4, 5];
export const HORA_INICIO = 8;
export const HORA_FIN = 18;

/** Texto del horario para la interfaz, en un solo lugar. */
export const HORARIO_TEXTO = "lunes a viernes de 8:00 a 6:00 p. m.";

const INICIO_MIN = HORA_INICIO * 60;
const FIN_MIN = HORA_FIN * 60;

/**
 * Convierte a un Date cuyos getUTC* devuelven la hora de pared de Bogota.
 * Es un truco deliberado: permite hacer toda la aritmetica del calendario
 * con los metodos UTC (que no dependen de la zona del proceso) y volver al
 * instante real al final con `desdeBogota`.
 */
function aBogota(fecha: Date): Date {
  return new Date(fecha.getTime() + OFFSET_BOGOTA_MINUTOS * 60000);
}

function desdeBogota(fecha: Date): Date {
  return new Date(fecha.getTime() - OFFSET_BOGOTA_MINUTOS * 60000);
}

function minutoDelDia(fecha: Date): number {
  return fecha.getUTCHours() * 60 + fecha.getUTCMinutes();
}

function esDiaLaborable(fecha: Date): boolean {
  return DIAS_LABORABLES.includes(fecha.getUTCDay());
}

/** Proxima apertura (8:00 del siguiente dia laborable) a partir de una fecha en hora de Bogota. */
function siguienteApertura(fecha: Date): Date {
  const siguiente = new Date(fecha);
  siguiente.setUTCDate(siguiente.getUTCDate() + 1);
  siguiente.setUTCHours(HORA_INICIO, 0, 0, 0);
  while (!esDiaLaborable(siguiente)) {
    siguiente.setUTCDate(siguiente.getUTCDate() + 1);
  }
  return siguiente;
}

/** True si el instante cae dentro de la jornada laboral. */
export function estaEnHorario(fecha: Date): boolean {
  const local = aBogota(fecha);
  if (!esDiaLaborable(local)) return false;
  const minuto = minutoDelDia(local);
  return minuto >= INICIO_MIN && minuto < FIN_MIN;
}

/**
 * Suma minutos de trabajo a partir de una fecha, saltando las noches y los
 * fines de semana. Si el punto de partida cae fuera de horario, el reloj
 * arranca en la siguiente apertura.
 */
export function sumarMinutosHabiles(desde: Date, minutos: number): Date {
  let cursor = aBogota(desde);
  let restante = Math.max(0, Math.round(minutos));

  if (!esDiaLaborable(cursor) || minutoDelDia(cursor) >= FIN_MIN) {
    cursor = siguienteApertura(cursor);
  } else if (minutoDelDia(cursor) < INICIO_MIN) {
    cursor = new Date(cursor);
    cursor.setUTCHours(HORA_INICIO, 0, 0, 0);
  }

  // Cota de seguridad: 400 jornadas es mas de un ano laboral, muy por encima
  // de cualquier estimado razonable. Evita un bucle infinito si alguien
  // configura mal el horario (por ejemplo, inicio igual a fin).
  for (let vuelta = 0; vuelta < 400 && restante > 0; vuelta++) {
    const disponibleHoy = FIN_MIN - minutoDelDia(cursor);
    if (restante <= disponibleHoy) {
      cursor = new Date(cursor.getTime() + restante * 60000);
      restante = 0;
      break;
    }
    restante -= disponibleHoy;
    cursor = siguienteApertura(cursor);
  }

  return desdeBogota(cursor);
}

/**
 * Como se le muestra el estimado a quien radica el ticket.
 *
 * Si la respuesta cae dentro de la misma jornada basta con los minutos
 * ("35 min"). Si se pasa a otro dia —radicado de noche, un viernes tarde o
 * con mucha cola— los minutos enganan, asi que se da la fecha concreta.
 */
export function describirEstimado(desde: Date, hasta: Date, minutosHabiles: number): string {
  const mismoDia =
    desde.toLocaleDateString("es-CO", { timeZone: ZONA }) ===
    hasta.toLocaleDateString("es-CO", { timeZone: ZONA });

  if (mismoDia) return formatearMinutos(minutosHabiles);

  const dia = hasta.toLocaleDateString("es-CO", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hora = hasta.toLocaleTimeString("es-CO", {
    timeZone: ZONA,
    hour: "numeric",
    minute: "2-digit",
  });

  return `${dia} a las ${hora}`;
}
