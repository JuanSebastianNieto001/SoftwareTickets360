import { prisma } from "@/lib/db";

/**
 * Genera un codigo de ticket legible tipo TCK-000123.
 * Usa el conteo total de tickets como base del correlativo.
 */
export async function generarCodigoTicket(): Promise<string> {
  const total = await prisma.ticket.count();
  const correlativo = String(total + 1).padStart(6, "0");
  const codigo = `TCK-${correlativo}`;

  // Por si hubo borrados y el correlativo choca, se resuelve con un sufijo.
  const existe = await prisma.ticket.findUnique({ where: { codigoTicket: codigo } });
  if (existe) {
    return `TCK-${correlativo}-${Date.now().toString().slice(-4)}`;
  }
  return codigo;
}

export function minutosEntre(inicio: Date, fin: Date): number {
  return Math.max(0, Math.round((fin.getTime() - inicio.getTime()) / 60000));
}

export function formatearMinutos(min: number | null | undefined): string {
  if (min === null || min === undefined) return "-";
  if (min < 60) return `${min} min`;
  const horas = Math.floor(min / 60);
  const resto = min % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
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
