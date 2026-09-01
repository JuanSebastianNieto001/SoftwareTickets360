type Estado = "PENDIENTE" | "EN_PROCESO" | "CERRADO";

const ETIQUETAS: Record<Estado, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  CERRADO: "Cerrado",
};

const CLASES: Record<Estado, string> = {
  PENDIENTE: "badge-pendiente",
  EN_PROCESO: "badge-proceso",
  CERRADO: "badge-cerrado",
};

export default function EstadoBadge({ estado }: { estado: Estado }) {
  return <span className={CLASES[estado]}>{ETIQUETAS[estado]}</span>;
}
