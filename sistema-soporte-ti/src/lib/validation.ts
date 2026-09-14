// Esquemas Zod compartidos por los formularios del cliente y las API routes
// (src/app/api/**): la misma definicion valida en ambos lados, asi que un
// mensaje de error cambiado aqui se refleja en toda la app.
import { z } from "zod";
import { AREA_ASESOR, AREAS, CATEGORIAS, TEAM_LEADERS } from "@/lib/ticket";

const crearTicketBase = z.object({
  nombreSolicitante: z.string().trim().min(3, "Escribe tu nombre completo").max(120),
  // Igual que teamLeader: solo aplica al area Asesor, asi que las reglas de
  // "obligatorio" y "solo numeros" viven en el superRefine de abajo.
  numeroPuesto: z.string().trim().max(10).optional(),
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
 * El team leader y el numero de puesto solo tienen sentido para los tickets
 * de asesores: si el area es Asesor son obligatorios; en Administrativos se
 * descarta lo que venga, para que no queden datos incoherentes en la tabla.
 */
export const crearTicketSchema = crearTicketBase
  .superRefine((datos, ctx) => {
    // En Administrativos no se valida ninguno de los dos: lo que llegue se
    // ignora en el transform de abajo.
    if (datos.area !== AREA_ASESOR) return;

    const leader = datos.teamLeader ?? "";
    if (!TEAM_LEADERS.includes(leader as (typeof TEAM_LEADERS)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["teamLeader"],
        message: "Selecciona el team leader del asesor",
      });
    }

    const puesto = datos.numeroPuesto ?? "";
    if (puesto === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["numeroPuesto"],
        message: "Ingresa el numero de tu puesto",
      });
    } else if (!/^[0-9]+$/.test(puesto)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["numeroPuesto"],
        message: "El numero del puesto solo puede tener numeros",
      });
    }
  })
  .transform((datos) => {
    const esAsesor = datos.area === AREA_ASESOR;
    return {
      ...datos,
      numeroPuesto: esAsesor ? (datos.numeroPuesto ?? "") : "",
      teamLeader: esAsesor ? (datos.teamLeader ?? "") : "",
    };
  });

export const cerrarTicketSchema = z.object({
  solucion: z.string().trim().min(5, "Describe la solucion aplicada").max(2000),
});

/**
 * Nombre visible del administrador: el del saludo del panel y el que queda
 * como "Atendido por" en los tickets que cierra.
 */
export const actualizarNombreAdminSchema = z.object({
  nombre: z.string().trim().min(3, "Escribe el nombre completo").max(120),
});

export const loginSchema = z.object({
  // Texto libre, no .email(): el usuario de login no tiene que ser un correo
  // (ej. "admin"), es solo el identificador del admin en la tabla User.
  correo: z.string().trim().min(1, "El usuario es obligatorio").max(150),
  password: z.string().min(1, "La contrasena es obligatoria"),
});
