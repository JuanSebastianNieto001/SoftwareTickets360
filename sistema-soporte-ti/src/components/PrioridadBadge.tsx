// Chip de color por prioridad (verde/ambar/rojo), usado en TicketForm,
// AdminDashboard y SeguimientoBuscador. `prioridad` recibe `string` (no el
// tipo Prioridad) porque llega tal cual desde la base de datos/API; si el
// valor no es uno de los tres validos, cae a MEDIA en vez de romper.
type Prioridad = "BAJA" | "MEDIA" | "ALTA";

const ETIQUETAS: Record<Prioridad, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
};

const CLASES: Record<Prioridad, string> = {
  BAJA: "badge bg-emerald-100 text-emerald-800",
  MEDIA: "badge bg-amber-100 text-amber-800",
  ALTA: "badge bg-red-100 text-red-800",
};

export default function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const clave = (prioridad in ETIQUETAS ? prioridad : "MEDIA") as Prioridad;
  return <span className={CLASES[clave]}>{ETIQUETAS[clave]}</span>;
}
