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
// CRITICA no la asigna ninguna categoria: depende del alcance del impacto
// (una falla que detiene un area completa), no del tipo de problema, asi que
// no hay forma de deducirla del formulario. La escala el admin a mano desde
// el panel (PATCH /api/admin/tickets/:id/prioridad).
export const PRIORIDADES = ["BAJA", "MEDIA", "ALTA", "CRITICA"] as const;

/**
 * Lideres de equipo de los asesores. Solo se pide cuando el area es
 * "Asesor": en Administrativos el campo queda vacio. Permite ver que team
 * leader concentra mas tickets de sus asesores.
 */
export const TEAM_LEADERS = [
  "Marko Velez",
  "Brahian Delgado",
  "Kelmer Santiago Pion",
  "Carlos Fernando Velez",
] as const;

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

// ---------------------------------------------------------------------------
// Acuerdo de nivel de servicio (SLA)
// ---------------------------------------------------------------------------

/**
 * Metas de atencion de una prioridad. Los dos tiempos se miden sobre las
 * marcas que ya registra el ticket:
 *
 *   primera respuesta = creacion -> "Voy en camino"  (campo tiempoLlegada)
 *   solucion          = "Voy en camino" -> cierre    (campo tiempoResolucion)
 *
 * `null` en una meta significa que esa prioridad no tiene un tope fijo, asi
 * que nunca se puede incumplir: es el caso de "En orden de llegada" (no hay
 * compromiso de respuesta) y de "depende del tercero" (el tiempo lo pone un
 * proveedor externo, no el area de TI). La `nota` es el texto de la tabla
 * que se muestra en la UI cuando la meta es null.
 */
export type AcuerdoNivelServicio = {
  descripcion: string;
  minutosPrimeraRespuesta: number | null;
  notaPrimeraRespuesta: string;
  minutosSolucion: number | null;
  notaSolucion: string;
};

/**
 * Tabla de SLA acordada con el negocio. Es la unica fuente de verdad: para
 * ajustar un tiempo se cambia aqui y se refleja en el panel, en la validacion
 * del cierre y en el Excel.
 *
 * Los topes de solucion son cortos a proposito (10 minutos) porque NO se
 * miden desde que el usuario reporta, sino desde que el tecnico marca "Voy en
 * camino": es el tiempo de arreglo en sitio, no la espera en la fila.
 */
export const SLA_POR_PRIORIDAD: Record<Prioridad, AcuerdoNivelServicio> = {
  CRITICA: {
    descripcion:
      "Falla que detiene la operacion de la compania o de un area completa (mas de 10 personas).",
    minutosPrimeraRespuesta: 10,
    notaPrimeraRespuesta: "10 min (si las pruebas establecidas lo permiten)",
    minutosSolucion: null,
    notaSolucion: "Depende del tercero",
  },
  ALTA: {
    descripcion: "Falla que impide a un usuario realizar su trabajo, sin alternativa.",
    minutosPrimeraRespuesta: 10,
    notaPrimeraRespuesta: "10 minutos",
    minutosSolucion: 10,
    notaSolucion: "10 minutos (si no involucra a terceros)",
  },
  MEDIA: {
    descripcion: "Falla o requerimiento que afecta parcialmente el trabajo; existe alternativa.",
    minutosPrimeraRespuesta: null,
    notaPrimeraRespuesta: "En orden de llegada",
    minutosSolucion: 10,
    notaSolucion: "10 minutos (si no involucra a terceros)",
  },
  BAJA: {
    descripcion: "Solicitud, consulta o mejora que no afecta la operacion.",
    minutosPrimeraRespuesta: null,
    notaPrimeraRespuesta: "En orden de llegada",
    minutosSolucion: 10,
    notaSolucion: "10 minutos (si no involucra a terceros)",
  },
};

/** SLA de una prioridad. Cae en el de MEDIA si llega una prioridad desconocida. */
export function slaParaPrioridad(prioridad: string): AcuerdoNivelServicio {
  return SLA_POR_PRIORIDAD[prioridad as Prioridad] ?? SLA_POR_PRIORIDAD.MEDIA;
}

/**
 * Resultado de comparar un tiempo real contra su meta.
 * SIN_META cubre los dos casos en los que no hay nada que juzgar: la
 * prioridad no tiene tope fijo, o el ticket todavia no llego a esa marca.
 */
export type ResultadoSla = "DENTRO" | "FUERA" | "SIN_META";

export type EvaluacionSla = {
  /**
   * Como le fue al tramo creacion -> "Voy en camino". Es informativo: se
   * muestra y se exporta, pero NO decide el veredicto (ver `general`).
   */
  primeraRespuesta: ResultadoSla;
  solucion: ResultadoSla;
  /**
   * Veredicto del ticket. Lo define **solo el tiempo de solucion**, es decir
   * el tramo "Voy en camino" -> cierre, que es lo que el area de soporte
   * controla una vez que llega al puesto.
   *
   * La demora en responder se sigue midiendo y mostrando, pero no marca el
   * ticket como incumplido: un caso atendido en 1 minuto no deberia salir en
   * rojo porque el reporte espero en la fila. Si algun dia se quiere que
   * tambien cuente, este es el unico punto a cambiar.
   */
  general: ResultadoSla;
  metaPrimeraRespuesta: number | null;
  metaSolucion: number | null;
  /** Minutos de mas sobre la meta de solucion. 0 si se cumplio o no habia meta. */
  excesoSolucion: number;
};

function compararConMeta(real: number | null | undefined, meta: number | null): ResultadoSla {
  if (meta === null || real === null || real === undefined) return "SIN_META";
  return real <= meta ? "DENTRO" : "FUERA";
}

/**
 * Evalua un ticket contra el SLA de su prioridad.
 *
 * No se guarda en la base a proposito: se deriva de la prioridad y de los
 * tiempos, que si estan guardados. Asi un ajuste en SLA_POR_PRIORIDAD no
 * deja registros viejos con un veredicto que ya no corresponde a la tabla.
 *
 * Sirve tanto para un ticket ya cerrado (con sus tiempos finales) como para
 * proyectar el cierre de uno en proceso: el panel le pasa los minutos
 * transcurridos hasta ahora para saber si al cerrar va a quedar fuera y
 * tiene que pedir la justificacion.
 */
export function evaluarSla(
  prioridad: string,
  tiempos: { minutosPrimeraRespuesta?: number | null; minutosSolucion?: number | null }
): EvaluacionSla {
  const sla = slaParaPrioridad(prioridad);
  const primeraRespuesta = compararConMeta(tiempos.minutosPrimeraRespuesta, sla.minutosPrimeraRespuesta);
  const solucion = compararConMeta(tiempos.minutosSolucion, sla.minutosSolucion);

  // El veredicto es el del tramo de solucion, tal cual. Ver el comentario de
  // `general` en EvaluacionSla para el porque.
  const general: ResultadoSla = solucion;

  const excesoSolucion =
    solucion === "FUERA" && sla.minutosSolucion !== null
      ? (tiempos.minutosSolucion ?? 0) - sla.minutosSolucion
      : 0;

  return {
    primeraRespuesta,
    solucion,
    general,
    metaPrimeraRespuesta: sla.minutosPrimeraRespuesta,
    metaSolucion: sla.minutosSolucion,
    excesoSolucion,
  };
}

/** Caracteres minimos que debe tener la explicacion de un incumplimiento. */
export const MIN_CARACTERES_JUSTIFICACION = 10;

/**
 * Nombre legible de cada prioridad. Vive aqui y no dentro del chip porque lo
 * usan tambien el selector de prioridad del panel y la tabla de SLA: si se
 * agrega una prioridad, el compilador obliga a nombrarla una sola vez.
 */
export const ETIQUETA_PRIORIDAD: Record<Prioridad, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Critica",
};
