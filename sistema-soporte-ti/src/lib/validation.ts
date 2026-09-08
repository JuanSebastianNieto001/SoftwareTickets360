// Esquemas Zod compartidos por los formularios del cliente y las API routes
// (src/app/api/**): la misma definicion valida en ambos lados, asi que un
// mensaje de error cambiado aqui se refleja en toda la app.
import { z } from "zod";
import { AREAS, CATEGORIAS } from "@/lib/ticket";

export const crearTicketSchema = z.object({
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
  // Sin campo "prioridad" a proposito: la calcula el servidor a partir de la
  // categoria (ver PRIORIDAD_POR_CATEGORIA en src/lib/ticket.ts), asi que si
  // el cliente manda una, se ignora.
});

export const cerrarTicketSchema = z.object({
  solucion: z.string().trim().min(5, "Describe la solucion aplicada").max(2000),
});

export const loginSchema = z.object({
  // Texto libre, no .email(): el usuario de login no tiene que ser un correo
  // (ej. "admin"), es solo el identificador del admin en la tabla User.
  correo: z.string().trim().min(1, "El usuario es obligatorio").max(150),
  password: z.string().min(1, "La contrasena es obligatoria"),
});
