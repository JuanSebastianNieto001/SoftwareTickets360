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
export const PRIORIDADES = ["BAJA", "MEDIA", "ALTA"] as const;

// Tipos derivados de los catalogos de arriba: al agregar un valor a una de
// esas listas, el tipo se actualiza solo y TypeScript marca los lugares que
// falte cubrir (por ejemplo PRIORIDAD_POR_CATEGORIA).
export type Estado = (typeof ESTADOS)[number];
export type Area = (typeof AREAS)[number];
export type Categoria = (typeof CATEGORIAS)[number];
export type Prioridad = (typeof PRIORIDADES)[number];

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
