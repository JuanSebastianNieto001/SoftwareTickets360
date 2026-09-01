"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import EstadoBadge from "@/components/EstadoBadge";
import { formatearMinutos } from "@/lib/ticket";

type Ticket = {
  id: string;
  codigoTicket: string;
  nombreSolicitante: string;
  correo: string;
  area: string;
  categoria: string;
  descripcion: string;
  estado: "PENDIENTE" | "EN_PROCESO" | "CERRADO";
  prioridad: string;
  fechaCreacion: string;
  fechaInicio: string | null;
  fechaCierre: string | null;
  tiempoLlegada: number | null;
  tiempoResolucion: number | null;
  tiempoTotal: number | null;
  solucion: string | null;
  admin: { nombre: string } | null;
};

const FILTROS = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "PENDIENTE", etiqueta: "Pendientes" },
  { valor: "EN_PROCESO", etiqueta: "En proceso" },
  { valor: "CERRADO", etiqueta: "Cerrados" },
] as const;

function formatearFecha(f: string | null) {
  if (!f) return "-";
  return new Date(f).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["valor"]>("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketAbierto, setTicketAbierto] = useState<string | null>(null);
  const [solucionTexto, setSolucionTexto] = useState("");
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const params = new URLSearchParams();
    if (filtro !== "TODOS") params.set("estado", filtro);
    if (busqueda.trim()) params.set("q", busqueda.trim());
    try {
      const res = await fetch(`/api/admin/tickets?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data.tickets);
    } catch {
      setError("No se pudieron cargar los tickets.");
    } finally {
      setCargando(false);
    }
  }, [filtro, busqueda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const contadores = useMemo(() => {
    return {
      PENDIENTE: tickets.filter((t) => t.estado === "PENDIENTE").length,
      EN_PROCESO: tickets.filter((t) => t.estado === "EN_PROCESO").length,
      CERRADO: tickets.filter((t) => t.estado === "CERRADO").length,
    };
  }, [tickets]);

  async function iniciarTicket(id: string) {
    setProcesando(id);
    try {
      const res = await fetch(`/api/admin/tickets/${id}/iniciar`, { method: "POST" });
      if (!res.ok) throw new Error();
      await cargar();
    } catch {
      setError("No se pudo iniciar el ticket.");
    } finally {
      setProcesando(null);
    }
  }

  async function cerrarTicket(id: string) {
    if (!solucionTexto.trim() || solucionTexto.trim().length < 5) {
      setError("Describe la solucion aplicada (minimo 5 caracteres).");
      return;
    }
    setProcesando(id);
    try {
      const res = await fetch(`/api/admin/tickets/${id}/cerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solucion: solucionTexto.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo cerrar el ticket.");
        return;
      }
      setTicketAbierto(null);
      setSolucionTexto("");
      await cargar();
    } catch {
      setError("No se pudo cerrar el ticket.");
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{contadores.PENDIENTE}</p>
          <p className="text-xs text-slate-500">Pendientes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{contadores.EN_PROCESO}</p>
          <p className="text-xs text-slate-500">En proceso</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{contadores.CERRADO}</p>
          <p className="text-xs text-slate-500">Cerrados</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filtro === f.valor ? "bg-white shadow text-brand-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
        <input
          className="input max-w-xs"
          placeholder="Buscar por codigo, nombre, correo o area..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <a
          href={`/api/admin/export/excel?fecha=${new Date().toISOString().slice(0, 10)}`}
          className="btn-secondary ml-auto"
        >
          Exportar Excel de hoy
        </a>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      )}

      {cargando ? (
        <p className="text-sm text-slate-500">Cargando tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-slate-500">No hay tickets que coincidan con el filtro.</p>
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => (
            <li key={t.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-700">{t.codigoTicket}</span>
                    <EstadoBadge estado={t.estado} />
                    <span className="badge bg-slate-100 text-slate-600">{t.prioridad}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {t.nombreSolicitante} · {t.area} · {t.categoria}
                  </p>
                  <p className="text-xs text-slate-500">{t.correo}</p>
                </div>
                <div className="flex gap-2">
                  {t.estado === "PENDIENTE" && (
                    <button
                      className="btn-primary"
                      disabled={procesando === t.id}
                      onClick={() => iniciarTicket(t.id)}
                    >
                      {procesando === t.id ? "Procesando..." : "Voy en camino"}
                    </button>
                  )}
                  {t.estado === "EN_PROCESO" && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setTicketAbierto(ticketAbierto === t.id ? null : t.id);
                        setSolucionTexto("");
                      }}
                    >
                      {ticketAbierto === t.id ? "Cancelar" : "Cerrar ticket"}
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-700">{t.descripcion}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
                <span>Creado: {formatearFecha(t.fechaCreacion)}</span>
                <span>Inicio: {formatearFecha(t.fechaInicio)}</span>
                <span>Cierre: {formatearFecha(t.fechaCierre)}</span>
                <span>Atendido por: {t.admin?.nombre ?? "-"}</span>
              </div>

              {t.estado === "CERRADO" && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <span className="rounded bg-slate-50 px-2 py-1">
                    Llegada: {formatearMinutos(t.tiempoLlegada)}
                  </span>
                  <span className="rounded bg-slate-50 px-2 py-1">
                    Resolucion: {formatearMinutos(t.tiempoResolucion)}
                  </span>
                  <span className="rounded bg-slate-50 px-2 py-1">
                    Total: {formatearMinutos(t.tiempoTotal)}
                  </span>
                </div>
              )}

              {t.estado === "CERRADO" && t.solucion && (
                <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  <strong>Solucion:</strong> {t.solucion}
                </p>
              )}

              {ticketAbierto === t.id && (
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                  <label className="label" htmlFor={`solucion-${t.id}`}>
                    Solucion aplicada
                  </label>
                  <textarea
                    id={`solucion-${t.id}`}
                    className="input min-h-[90px]"
                    value={solucionTexto}
                    onChange={(e) => setSolucionTexto(e.target.value)}
                    placeholder="Describe que se hizo para resolver el problema"
                  />
                  <button
                    className="btn-primary"
                    disabled={procesando === t.id}
                    onClick={() => cerrarTicket(t.id)}
                  >
                    {procesando === t.id ? "Guardando..." : "Confirmar cierre"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
