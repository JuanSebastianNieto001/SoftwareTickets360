// Chip de color por prioridad, usado en TicketForm, AdminDashboard y
// SeguimientoBuscador. `prioridad` recibe `string` (no el tipo Prioridad)
// porque llega tal cual desde la base de datos/API; si el valor no es uno de
// los validos, cae a MEDIA en vez de romper.
//
// CRITICA va en rojo solido y no en tono claro como las demas: es la unica
// que significa que hay un area entera detenida, y tiene que saltar a la
// vista en una lista larga de tickets.
type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

const ETIQUETAS: Record<Prioridad, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Critica",
};

const CLASES: Record<Prioridad, string> = {
  BAJA: "badge bg-emerald-100 text-emerald-800",
  MEDIA: "badge bg-amber-100 text-amber-800",
  ALTA: "badge bg-red-100 text-red-800",
  CRITICA: "badge bg-red-600 text-white",
};

export default function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const clave = (prioridad in ETIQUETAS ? prioridad : "MEDIA") as Prioridad;
  return <span className={CLASES[clave]}>{ETIQUETAS[clave]}</span>;
}
