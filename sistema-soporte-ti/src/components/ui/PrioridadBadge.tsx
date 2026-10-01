// Chip de color por prioridad, usado en TicketForm, AdminDashboard y
// SeguimientoBuscador. `prioridad` recibe `string` (no el tipo Prioridad)
// porque llega tal cual desde la base de datos/API; si el valor no es uno de
// los validos, cae a MEDIA en vez de romper.
import { ETIQUETA_PRIORIDAD } from "@/lib/ticket";

type Prioridad = keyof typeof ETIQUETA_PRIORIDAD;

// CRITICA va en rojo solido y no en el rojo claro de ALTA: son dos niveles
// distintos de urgencia y en una lista llena de chips tenian que poder
// distinguirse de un vistazo, no leyendo la etiqueta.
const CLASES: Record<Prioridad, string> = {
  BAJA: "badge bg-emerald-100 text-emerald-800",
  MEDIA: "badge bg-amber-100 text-amber-800",
  ALTA: "badge bg-red-100 text-red-800",
  CRITICA: "badge bg-red-600 text-white",
};

export default function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const clave = (prioridad in ETIQUETA_PRIORIDAD ? prioridad : "MEDIA") as Prioridad;
  return <span className={CLASES[clave]}>{ETIQUETA_PRIORIDAD[clave]}</span>;
}
