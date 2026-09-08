// Generacion del codigo visible del ticket. Vive aparte de src/lib/ticket.ts
// porque es lo unico del dominio que toca la base de datos: si estuviera en
// ese archivo, los componentes de cliente que importan los catalogos
// (TicketForm, AdminDashboard, SeguimientoBuscador) arrastrarian Prisma al
// bundle del navegador.
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
