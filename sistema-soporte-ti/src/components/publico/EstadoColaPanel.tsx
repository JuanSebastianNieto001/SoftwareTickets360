// Posicion en la cola y estimado de primera respuesta de un ticket pendiente.
// Lo usan la pantalla de exito al radicar (TicketForm) y la consulta publica
// (SeguimientoBuscador), para que ambas cuenten lo mismo. El calculo viene
// del servidor (src/lib/cola.ts) y depende de la prioridad y de cuantos
// tickets haya esperando en ese momento.
//
// El import de tipo se borra al compilar, asi que no arrastra prisma al
// navegador.
import type { EstadoCola } from "@/lib/cola";
import { slaParaPrioridad } from "@/lib/ticket";
import { HORARIO_TEXTO } from "@/lib/horario";
import PrioridadBadge from "@/components/ui/PrioridadBadge";

export default function EstadoColaPanel({
  cola,
  prioridad,
  momento,
}: {
  cola: EstadoCola;
  prioridad: string;
  /** "radicado": recien creado. "consulta": se revisa despues, desde el seguimiento. */
  momento: "radicado" | "consulta";
}) {
  // El ticket ya cuenta dentro de `enCola`, asi que "delante" es lo que hay
  // que esperar antes de que llegue su turno.
  const delante = Math.max(0, cola.posicion - 1);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm text-slate-600">Tu posicion en la cola para este ticket es:</span>
        <span className="text-2xl font-bold leading-none text-brand-700">#{cola.posicion}</span>
      </div>

      <p className="text-sm text-slate-600">
        {delante === 0
          ? "Eres el siguiente en ser atendido."
          : delante === 1
            ? "Hay 1 ticket antes que el tuyo."
            : `Hay ${delante} tickets antes que el tuyo.`}{" "}
        {cola.enCola === 1
          ? "Es el unico pendiente en este momento."
          : `En total hay ${cola.enCola} tickets pendientes`}
        {cola.enCola > 1 && cola.enAtencion > 0
          ? ` y ${cola.enAtencion} en atencion.`
          : cola.enCola > 1
            ? "."
            : ""}
      </p>

      <dl className="space-y-2 border-t border-slate-200 pt-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-slate-600">Prioridad</dt>
          <dd>
            <PrioridadBadge prioridad={prioridad} />
          </dd>
        </div>
        {/* Lo pactado en la tabla de SLA: un tiempo para las prioridades
            altas, "En orden de llegada" para las demas. Se muestra aparte
            del estimado para no confundir un compromiso con una
            proyeccion. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-slate-600">Tiempo de primera respuesta</dt>
          <dd className="font-medium text-slate-900">
            {slaParaPrioridad(prioridad).notaPrimeraRespuesta}
          </dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-slate-600">Estimado segun la cola de ahora</dt>
          <dd className="font-semibold text-slate-900">{cola.estimadoTexto}</dd>
        </div>
      </dl>

      {/* Fuera de la jornada: los tiempos se cuentan solo dentro del horario
          laboral, asi que conviene decirlo y no dejar que la fecha del
          estimado se lea como una demora. */}
      {!cola.dentroDeHorario && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {momento === "radicado"
            ? `Radicaste tu ticket fuera del horario de atencion (${HORARIO_TEXTO}).`
            : `En este momento estamos fuera del horario de atencion (${HORARIO_TEXTO}).`}{" "}
          El tiempo empieza a contar desde la siguiente apertura.
        </p>
      )}

      <p className="text-xs text-slate-500">
        El estimado se calcula con la prioridad de tu caso y con lo que esta tomando
        atender los tickets que hay delante. Puede variar.
      </p>
    </div>
  );
}
