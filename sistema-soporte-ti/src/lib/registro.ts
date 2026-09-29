// Bitacora de actividad: deja constancia de lo que hace cada usuario
// autenticado. La lee el lider de TI desde el panel de administrador.
//
// Consulta la base, asi que solo se puede importar desde el servidor.
import { prisma } from "@/lib/db";
import type { SesionPayload } from "@/lib/auth";

/**
 * Acciones que se registran. Son texto y no un enum nativo por la misma
 * razon que estado y prioridad (ver prisma/schema.prisma): el proyecto
 * tambien puede correr sobre SQLite en desarrollo.
 */
export const ACCIONES = {
  INICIO_SESION: "INICIO_SESION",
  TICKET_INICIADO: "TICKET_INICIADO",
  TICKET_CERRADO: "TICKET_CERRADO",
  TICKET_ELIMINADO: "TICKET_ELIMINADO",
  TICKETS_ELIMINADOS: "TICKETS_ELIMINADOS",
  PRIORIDAD_CAMBIADA: "PRIORIDAD_CAMBIADA",
  USUARIO_CREADO: "USUARIO_CREADO",
  PASSWORD_RESTABLECIDA: "PASSWORD_RESTABLECIDA",
  NOMBRE_CAMBIADO: "NOMBRE_CAMBIADO",
} as const;

export type Accion = (typeof ACCIONES)[keyof typeof ACCIONES];

/** Texto legible de cada accion, para la tabla del panel. */
export const ETIQUETA_ACCION: Record<Accion, string> = {
  INICIO_SESION: "Inicio de sesion",
  TICKET_INICIADO: "Tomo un ticket",
  TICKET_CERRADO: "Cerro un ticket",
  TICKET_ELIMINADO: "Elimino un ticket",
  TICKETS_ELIMINADOS: "Borrado masivo",
  PRIORIDAD_CAMBIADA: "Cambio la prioridad",
  USUARIO_CREADO: "Creo una cuenta",
  PASSWORD_RESTABLECIDA: "Restablecio una contrasena",
  NOMBRE_CAMBIADO: "Cambio un nombre",
};

/**
 * Anota una accion en la bitacora.
 *
 * Nunca lanza: un fallo al registrar no puede tumbar la operacion que el
 * usuario pidio. Si la escritura falla, se deja rastro en los logs del
 * servidor y la accion principal sigue su curso — es preferible perder una
 * linea de bitacora a que no se pueda cerrar un ticket.
 */
export async function registrar(
  sesion: SesionPayload | null,
  accion: Accion,
  detalle: string,
  ticketCodigo?: string | null
): Promise<void> {
  try {
    await prisma.registroActividad.create({
      data: {
        usuarioId: sesion?.userId ?? null,
        usuarioNombre: sesion?.nombre ?? "Desconocido",
        accion,
        detalle,
        ticketCodigo: ticketCodigo ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo escribir en la bitacora de actividad:", error);
  }
}
