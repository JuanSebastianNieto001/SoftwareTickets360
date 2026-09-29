// Reglas de negocio y catalogos del dominio "ticket": calculo y formato de
// tiempos de atencion, las listas de valores permitidos para
// area/categoria/prioridad y la tabla que asigna prioridad segun categoria.
// Estas mismas listas alimentan los z.enum() de src/lib/validation.ts, asi
// que son la unica fuente de verdad: para agregar una categoria o area
// nueva, solo hay que tocar aqui.
//
// IMPORTANTE: este archivo no debe importar la base de datos ni nada de
// servidor. Lo usan componentes de cliente, y cualquier import de Prisma
// aqui termina viajando al navegador. La unica funcion del dominio que
// consulta la base vive aparte, en src/lib/codigoTicket.ts.

/** Diferencia en minutos, redondeada y nunca negativa (por si los relojes del cliente/servidor difieren). */
export function minutosEntre(inicio: Date, fin: Date): number {
  return Math.max(0, Math.round((fin.getTime() - inicio.getTime()) / 60000));
}

/** Formatea minutos para la UI: "45 min", "2 h", "2 h 15 min". */
export function formatearMinutos(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined) return "-";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/**
 * Fecha y hora en formato colombiano para la UI.
 * `vacio` es lo que se devuelve cuando no hay fecha (el panel usa "-" y el
 * seguimiento no muestra nada).
 */
export function formatearFechaHora(
  fecha: string | Date | null | undefined,
  { estilo = "short", vacio = "-" }: { estilo?: "short" | "medium"; vacio?: string } = {}
): string {
  if (!fecha) return vacio;
  return new Date(fecha).toLocaleString("es-CO", { dateStyle: estilo, timeStyle: "short" });
}

export const ESTADOS = ["PENDIENTE", "EN_PROCESO", "CERRADO"] as const;
export const AREAS = ["Asesor", "Administrativos"] as const;
export const CATEGORIAS = [
  "Hardware",
  "Software",
  "Red / Internet",
  "Correo electronico",
  "Impresoras",
  "Accesos y credenciales",
  "Otro",
] as const;
// CRITICA sale del Acta N.o 002 y no se deduce de la categoria como las
// otras tres: depende del alcance de la falla (ver ALCANCES mas abajo).
export const PRIORIDADES = ["BAJA", "MEDIA", "ALTA", "CRITICA"] as const;

/**
 * A cuanta gente afecta la falla. Es lo unico que decide si un ticket es
 * CRITICO, segun el acta: "falla que detiene la operacion de la compania o
 * de un area completa (mas de 10 personas)".
 */
export const ALCANCES = ["INDIVIDUAL", "EQUIPO", "AREA"] as const;

/**
 * Lideres de equipo de los asesores. Solo se pide cuando el area es
 * "Asesor": en Administrativos el campo queda vacio. Permite ver que team
 * leader concentra mas tickets de sus asesores.
 */
export const TEAM_LEADERS = ["Marko Velez", "Brahian Delgado", "Kelmer Santiago Pion"] as const;

/**
 * Area cuyos tickets llevan team leader y numero de puesto. Los de
 * Administrativos no: no trabajan en un puesto numerado de la operacion ni
 * dependen de un team leader, asi que esos dos campos ni se piden en el
 * formulario ni se guardan (quedan en "").
 */
export const AREA_ASESOR = "Asesor";

// Tipos derivados de los catalogos de arriba: al agregar un valor a una de
// esas listas, el tipo se actualiza solo y TypeScript marca los lugares que
// falte cubrir (por ejemplo PRIORIDAD_POR_CATEGORIA).
export type Estado = (typeof ESTADOS)[number];
export type Area = (typeof AREAS)[number];
export type Categoria = (typeof CATEGORIAS)[number];
export type Prioridad = (typeof PRIORIDADES)[number];
export type TeamLeader = (typeof TEAM_LEADERS)[number];
export type Alcance = (typeof ALCANCES)[number];

/** Texto de cada alcance en el formulario, con los rangos que usa el acta. */
export const ETIQUETA_ALCANCE: Record<Alcance, string> = {
  INDIVIDUAL: "Solo a mi",
  EQUIPO: "A mi equipo (2 a 10 personas)",
  AREA: "A un area completa (mas de 10 personas)",
};

/**
 * Prioridad que se asigna sola segun la categoria del problema. Aplica igual
 * para las dos areas (Asesor y Administrativos).
 *
 * La define el negocio, no quien reporta: por eso el formulario publico ya no
 * pide prioridad y el servidor la calcula con esta tabla (asi nadie puede
 * marcar su propio caso como urgente para saltarse la fila).
 */
export const PRIORIDAD_POR_CATEGORIA: Record<Categoria, Prioridad> = {
  Hardware: "ALTA",
  Software: "ALTA",
  "Red / Internet": "ALTA",
  "Accesos y credenciales": "ALTA",
  "Correo electronico": "MEDIA",
  Impresoras: "BAJA",
  Otro: "BAJA",
};

/** Prioridad correspondiente a una categoria. Cae en MEDIA si llega una categoria desconocida. */
export function prioridadParaCategoria(categoria: string): Prioridad {
  return PRIORIDAD_POR_CATEGORIA[categoria as Categoria] ?? "MEDIA";
}

/**
 * Prioridad definitiva del ticket, combinando categoria y alcance.
 *
 * El alcance manda sobre la categoria: el acta define CRITICA por cuanta
 * gente queda detenida, no por que se dano. Una impresora (categoria BAJA)
 * que deja sin trabajar a un area completa es critica igual.
 */
export function prioridadParaTicket(categoria: string, alcance: string): Prioridad {
  if (alcance === "AREA") return "CRITICA";
  return prioridadParaCategoria(categoria);
}

/**
 * Compromiso de primera respuesta por prioridad, segun el Acta N.o 002
 * "Calibracion de tiempos de respuesta y KPI-S" del 16/09/2026.
 *
 * Solo ALTA tiene un tiempo comprometido (10 minutos). MEDIA y BAJA se
 * atienden "en orden de llegada": el acta no les fija una meta, asi que su
 * `metaMinutos` es 0 a proposito y el estimado sale unicamente de la espera
 * de la cola. Poner ahi un numero inventado seria prometer algo que la
 * compañia no acordo.
 *
 * `compromiso` es el texto que se le muestra al usuario, con las palabras
 * del acta: el estimado es una proyeccion, esto es lo pactado.
 */
export const PRIMERA_RESPUESTA: Record<Prioridad, { metaMinutos: number; compromiso: string }> = {
  CRITICA: { metaMinutos: 10, compromiso: "10 minutos, si las pruebas establecidas lo permiten" },
  ALTA: { metaMinutos: 10, compromiso: "10 minutos" },
  MEDIA: { metaMinutos: 0, compromiso: "En orden de llegada" },
  BAJA: { metaMinutos: 0, compromiso: "En orden de llegada" },
};

/**
 * Tiempo maximo de solucion por prioridad, en minutos (Acta N.o 002,
 * numeral 7). Es el criterio del indicador KPI-S2.
 *
 * En CRITICA el acta dice "depende del tercero", asi que no hay limite que
 * medir y queda en null. Las otras tres tienen el mismo valor porque asi lo
 * fija el acta, que ademas advierte que la tabla "sera ajustada y
 * confirmada por la compania": cuando eso pase, este es el unico lugar a
 * tocar.
 */
export const TIEMPO_MAXIMO_SOLUCION: Record<Prioridad, number | null> = {
  CRITICA: null,
  ALTA: 10,
  MEDIA: 10,
  BAJA: 10,
};

/**
 * Compara el tiempo de solucion de un ticket contra el limite de su
 * prioridad. Devuelve null cuando no hay nada que medir: prioridad sin
 * limite definido (CRITICA, que "depende del tercero") o ticket que
 * todavia no tiene un tiempo transcurrido.
 */
export function evaluarTiempoSolucion(
  prioridad: string,
  minutosTranscurridos: number | null | undefined
): { limite: number; vencido: boolean } | null {
  const limite = TIEMPO_MAXIMO_SOLUCION[prioridad as Prioridad];
  if (limite === null || limite === undefined) return null;
  if (minutosTranscurridos === null || minutosTranscurridos === undefined) return null;
  return { limite, vencido: minutosTranscurridos > limite };
}

/**
 * Cuanto se asume que ocupa cada ticket cuando todavia no hay historial del
 * cual sacar un promedio real (base recien estrenada, sin tickets cerrados).
 */
export const MINUTOS_POR_TICKET_POR_DEFECTO = 15;

/**
 * Orden de atencion de la cola: primero las prioridades altas y, dentro de
 * la misma prioridad, el que lleva mas tiempo esperando. El numero solo
 * sirve para comparar (menor = se atiende antes).
 */
export const ORDEN_PRIORIDAD: Record<Prioridad, number> = {
  CRITICA: 0,
  ALTA: 1,
  MEDIA: 2,
  BAJA: 3,
};

/** Prioridades que se atienden ANTES que la dada. */
export function prioridadesSuperioresA(prioridad: Prioridad): Prioridad[] {
  return PRIORIDADES.filter((p) => ORDEN_PRIORIDAD[p] < ORDEN_PRIORIDAD[prioridad]);
}

/**
 * Estimado de primera respuesta en minutos: la meta de la prioridad mas el
 * tiempo que tomara despachar lo que hay delante. Los tickets que ya estan
 * en atencion cuentan como "delante" aunque no esten en la cola, porque
 * igual tienen ocupado al tecnico.
 *
 * Para MEDIA y BAJA la meta es 0 (ver PRIMERA_RESPUESTA), asi que el
 * estimado es solo la espera de la cola, que es justo lo que significa
 * "en orden de llegada".
 */
export function estimarPrimeraRespuesta(
  prioridad: Prioridad,
  ticketsDelante: number,
  minutosPorTicket: number
): number {
  const meta = (PRIMERA_RESPUESTA[prioridad] ?? PRIMERA_RESPUESTA.MEDIA).metaMinutos;
  return meta + Math.max(0, ticketsDelante) * Math.max(1, Math.round(minutosPorTicket));
}

/**
 * Redondeo "amable" del estimado antes de mostrarlo: a multiplos de 5
 * minutos por debajo de una hora y de 15 por encima. Prometer "1 h 30 min"
 * es honesto; prometer "87 min" finge una precision que no tenemos.
 */
export function redondearEstimado(minutos: number): number {
  const paso = minutos < 60 ? 5 : 15;
  return Math.max(paso, Math.ceil(minutos / paso) * paso);
}
