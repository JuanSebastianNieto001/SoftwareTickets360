"use client";

// Tabla de referencia del acuerdo de nivel de servicio, en el panel del
// admin. Es la misma tabla acordada con el negocio, leida de
// SLA_POR_PRIORIDAD: no hay una copia en HTML que se pueda desincronizar de
// la que usa el sistema para juzgar los cierres.
//
// Arranca plegada porque es material de consulta, no algo que se mire todos
// los dias: el panel es para trabajar los tickets.
import { useState } from "react";
import PrioridadBadge from "@/components/PrioridadBadge";
import { PRIORIDADES, SLA_POR_PRIORIDAD } from "@/lib/ticket";

// De mayor a menor urgencia, al reves de PRIORIDADES (que esta ordenada de
// menor a mayor porque asi crecio el catalogo). En una tabla de compromisos
// lo primero que se busca es el caso mas grave.
const ORDEN_TABLA = [...PRIORIDADES].reverse();

export default function TablaSla() {
  const [abierta, setAbierta] = useState(false);

  return (
    <div className="card p-4">
      <button
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-brand-900">
          Acuerdo de nivel de servicio (SLA)
        </span>
        <span className="text-xs text-slate-500">{abierta ? "Ocultar" : "Ver tiempos"}</span>
      </button>

      {abierta && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3 font-semibold">Prioridad</th>
                <th className="py-2 pr-3 font-semibold">Descripcion</th>
                <th className="py-2 pr-3 font-semibold">Tiempo de primera respuesta</th>
                <th className="py-2 font-semibold">Tiempo maximo de solucion</th>
              </tr>
            </thead>
            <tbody>
              {ORDEN_TABLA.map((prioridad) => {
                const sla = SLA_POR_PRIORIDAD[prioridad];
                return (
                  <tr key={prioridad} className="border-b border-slate-100 align-top last:border-0">
                    <td className="py-2 pr-3">
                      <PrioridadBadge prioridad={prioridad} />
                    </td>
                    <td className="py-2 pr-3 text-slate-700">{sla.descripcion}</td>
                    <td className="py-2 pr-3 text-slate-700">{sla.notaPrimeraRespuesta}</td>
                    <td className="py-2 text-slate-700">{sla.notaSolucion}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="mt-3 text-xs text-slate-500">
            Los tiempos de solucion se miden desde que se marca &quot;Voy en camino&quot; hasta que se
            cierra el ticket, no desde que el usuario reporta. Cuando un cierre supera su meta, el
            sistema pide explicar por que tomo mas tiempo.
          </p>
        </div>
      )}
    </div>
  );
}
