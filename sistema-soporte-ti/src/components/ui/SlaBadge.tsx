// Chip de cumplimiento del acuerdo de nivel de servicio, con el detalle de
// que meta se comparo. Se usa en el panel del admin sobre los tickets
// cerrados y tambien en vivo mientras se cierra uno, para avisar antes de
// confirmar que va a quedar fuera de tiempo.
//
// El veredicto no se lee de la base: lo calcula evaluarSla() con la prioridad
// del ticket y sus tiempos (ver src/lib/ticket.ts), y mira solo el tramo
// "Voy en camino" -> cierre. El tiempo de primera respuesta se muestra al
// lado como dato, en gris, porque no decide el resultado: en ambar si se
// paso de su meta, para que se note sin leerse como un incumplimiento.
import { formatearMinutos, type EvaluacionSla } from "@/lib/ticket";

const CLASES: Record<EvaluacionSla["general"], string> = {
  DENTRO: "badge bg-emerald-100 text-emerald-800",
  FUERA: "badge bg-red-100 text-red-800",
  SIN_META: "badge bg-slate-100 text-slate-600",
};

const ETIQUETAS: Record<EvaluacionSla["general"], string> = {
  DENTRO: "Dentro del SLA",
  FUERA: "Fuera del SLA",
  SIN_META: "Sin meta de SLA",
};

export default function SlaBadge({
  sla,
  minutosSolucion,
  minutosPrimeraRespuesta,
  detalle = true,
}: {
  sla: EvaluacionSla;
  /** Tiempo real de solucion, para el texto "12 min de 10 min". */
  minutosSolucion: number | null | undefined;
  /** Tiempo real hasta "Voy en camino". Solo informativo. */
  minutosPrimeraRespuesta?: number | null;
  /** false deja solo el chip, sin la comparacion contra las metas. */
  detalle?: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={CLASES[sla.general]}>{ETIQUETAS[sla.general]}</span>
      {detalle && sla.metaSolucion !== null && (
        <span className="text-xs text-slate-500">
          Solucion: {formatearMinutos(minutosSolucion)} de {formatearMinutos(sla.metaSolucion)}
          {sla.excesoSolucion > 0 ? ` (${formatearMinutos(sla.excesoSolucion)} de mas)` : ""}
        </span>
      )}
      {detalle && sla.metaPrimeraRespuesta !== null && (
        <span
          className={
            sla.primeraRespuesta === "FUERA" ? "text-xs text-amber-700" : "text-xs text-slate-500"
          }
        >
          Primera respuesta: {formatearMinutos(minutosPrimeraRespuesta)} de{" "}
          {formatearMinutos(sla.metaPrimeraRespuesta)}
        </span>
      )}
    </span>
  );
}
