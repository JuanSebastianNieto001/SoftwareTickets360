// Esquemas Zod compartidos por los formularios del cliente y las API routes
// (src/app/api/**): la misma definicion valida en ambos lados, asi que un
// mensaje de error cambiado aqui se refleja en toda la app.
import { z } from "zod";
import { AREA_CON_TEAM_LEADER, AREAS, CATEGORIAS, TEAM_LEADERS } from "@/lib/ticket";

const crearTicketBase = z.object({
  nombreSolicitante: z.string().trim().min(3, "Escribe tu nombre completo").max(120),
  numeroPuesto: z
    .string()
    .trim()
    .min(1, "Ingresa el numero de tu puesto")
    .max(10)
    .regex(/^[0-9]+$/, "El numero del puesto solo puede tener numeros"),
  area: z.enum(AREAS, { errorMap: () => ({ message: "Selecciona un area valida" }) }),
  categoria: z.enum(CATEGORIAS, { errorMap: () => ({ message: "Selecciona una categoria valida" }) }),
  descripcion: z.string().trim().min(10, "Describe el problema con mas detalle (minimo 10 caracteres)").max(2000),
  // Solo obligatorio cuando el area es Asesor; la regla esta abajo, en el
  // superRefine, porque depende de otro campo del mismo objeto.
  teamLeader: z.string().trim().optional(),
  // Sin campo "prioridad" a proposito: la calcula el servidor a partir de la
  // categoria (ver PRIORIDAD_POR_CATEGORIA en src/lib/ticket.ts), asi que si
  // el cliente manda una, se ignora.
});

/**
 * El team leader solo tiene sentido para los tickets de asesores: si el area
 * es Asesor es obligatorio y debe ser uno de la lista; en Administrativos se
 * descarta lo que venga, para que no queden datos incoherentes en la tabla.
 */
export const crearTicketSchema = crearTicketBase
  .superRefine((datos, ctx) => {
    const esAsesor = datos.area === AREA_CON_TEAM_LEADER;
    const leader = datos.teamLeader ?? "";

    if (esAsesor && !TEAM_LEADERS.includes(leader as (typeof TEAM_LEADERS)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["teamLeader"],
        message: "Selecciona el team leader del asesor",
      });
    }
  })
  .transform((datos) => ({
    ...datos,
    teamLeader: datos.area === AREA_CON_TEAM_LEADER ? (datos.teamLeader ?? "") : "",
  }));

export const cerrarTicketSchema = z.object({
  solucion: z.string().trim().min(5, "Describe la solucion aplicada").max(2000),
});

export const loginSchema = z.object({
  // Texto libre, no .email(): el usuario de login no tiene que ser un correo
  // (ej. "admin"), es solo el identificador del admin en la tabla User.
  correo: z.string().trim().min(1, "El usuario es obligatorio").max(150),
  password: z.string().min(1, "La contrasena es obligatoria"),
});
