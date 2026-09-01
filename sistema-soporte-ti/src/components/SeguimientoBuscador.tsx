"use client";

import { useState, FormEvent, useEffect } from "react";
import EstadoBadge from "@/components/EstadoBadge";
import { formatearMinutos } from "@/lib/ticket";

type Ticket = {
  codigoTicket: string;
  estado: "PENDIENTE" | "EN_PROCESO" | "CERRADO";
  categoria: string;
  area: string;
  prioridad: string;
  fechaCreacion: string;
  fechaInicio: string | null;
  fechaCierre: string | null;
  tiempoLlegada: number | null;
  tiempoResolucion: number | null;
  tiempoTotal: number | null;
  solucion: string | null;
};

function formatearFecha(f: string | null) {
  if (!f) return null;
  return new Date(f).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

export default function SeguimientoBuscador({ codigoInicial }: { codigoInicial?: string }) {
  const [codigo, setCodigo] = useState(codigoInicial ?? "");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function buscar(codigoBuscado: string) {
    if (!codigoBuscado.trim()) return;
    setCargando(true);
    setError(null);
    setTicket(null);
    try {
      const res = await fetch(`/api/tickets/consulta?codigo=${encodeURIComponent(codigoBuscado.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se encontro el ticket");
        return;
      }
      setTicket(data.ticket);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (codigoInicial) buscar(codigoInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoInicial]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    buscar(codigo);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="card flex gap-2 p-4">
        <input
          className="input"
          placeholder="Ej. TCK-000001"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <button className="btn-primary shrink-0" disabled={cargando}>
          {cargando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {ticket && (
        <div className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-700">{ticket.codigoTicket}</h2>
            <EstadoBadge estado={ticket.estado} />
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Categoria</dt>
              <dd className="font-medium">{ticket.categoria}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Area</dt>
              <dd className="font-medium">{ticket.area}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Prioridad</dt>
              <dd className="font-medium">{ticket.prioridad}</dd>
            </div>
          </dl>

          <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
            <li>
              <p className="text-sm font-medium text-slate-900">Ticket creado</p>
              <p className="text-xs text-slate-500">{formatearFecha(ticket.fechaCreacion)}</p>
            </li>
            {ticket.fechaInicio && (
              <li>
                <p className="text-sm font-medium text-slate-900">
                  El administrador va en camino / inicio la atencion
                </p>
                <p className="text-xs text-slate-500">
                  {formatearFecha(ticket.fechaInicio)} · tiempo de llegada:{" "}
                  {formatearMinutos(ticket.tiempoLlegada)}
                </p>
              </li>
            )}
            {ticket.fechaCierre && (
              <li>
                <p className="text-sm font-medium text-slate-900">Ticket cerrado</p>
                <p className="text-xs text-slate-500">
                  {formatearFecha(ticket.fechaCierre)} · tiempo de resolucion:{" "}
                  {formatearMinutos(ticket.tiempoResolucion)} · tiempo total:{" "}
                  {formatearMinutos(ticket.tiempoTotal)}
                </p>
              </li>
            )}
          </ol>

          {ticket.solucion && (
            <div>
              <p className="label">Solucion aplicada</p>
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{ticket.solucion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
