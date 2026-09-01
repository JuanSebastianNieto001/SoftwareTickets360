import { z } from "zod";
import { CATEGORIAS, PRIORIDADES } from "@/lib/ticket";

export const crearTicketSchema = z.object({
  nombreSolicitante: z.string().trim().min(3, "Escribe tu nombre completo").max(120),
  correo: z.string().trim().email("Correo invalido").max(150),
  area: z.string().trim().min(2, "Indica tu area").max(80),
  categoria: z.enum(CATEGORIAS, { errorMap: () => ({ message: "Selecciona una categoria valida" }) }),
  descripcion: z.string().trim().min(10, "Describe el problema con mas detalle (minimo 10 caracteres)").max(2000),
  prioridad: z.enum(PRIORIDADES).optional(),
});

export const cerrarTicketSchema = z.object({
  solucion: z.string().trim().min(5, "Describe la solucion aplicada").max(2000),
});

export const loginSchema = z.object({
  correo: z.string().trim().email("Correo invalido"),
  password: z.string().min(1, "La contrasena es obligatoria"),
});
