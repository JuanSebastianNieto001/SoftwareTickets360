"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EstadoBadge from "@/components/EstadoBadge";
import PrioridadBadge from "@/components/PrioridadBadge";
import { IconTrash } from "@/components/icons";
import { formatearMinutos } from "@/lib/ticket";

const INTERVALO_ACTUALIZACION_MS = 5000;

type Ticket = {
  id: string;
  codigoTicket: string;
  nombreSolicitante: string;
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
  const primeraCargaHecha = useRef(false);

  const cargar = useCallback(async () => {
    // Solo mostramos "Cargando..." la primera vez; las actualizaciones
    // automaticas en segundo plano no deben hacer parpadear la lista.
    if (!primeraCargaHecha.current) setCargando(true);
    const params = new URLSearchParams();
    if (filtro !== "TODOS") params.set("estado", filtro);
    if (busqueda.trim()) params.set("q", busqueda.trim());
    try {
      const res = await fetch(`/api/admin/tickets?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data.tickets);
      setError(null);
    } catch {
      setError("No se pudieron cargar los tickets.");
    } finally {
      setCargando(false);
      primeraCargaHecha.current = true;
    }
  }, [filtro, busqueda]);

  useEffect(() => {
    primeraCargaHecha.current = false;
    cargar();
    const intervalo = setInterval(cargar, INTERVALO_ACTUALIZACION_MS);
    return () => clearInterval(intervalo);
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

  async function eliminarTicket(id: string, codigo: string) {
    const confirmado = window.confirm(
      `¿Eliminar el ticket ${codigo}? Esta accion no se puede deshacer.`
    );
    if (!confirmado) return;

    setProcesando(id);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await cargar();
    } catch {
      setError(`No se pudo eliminar el ticket ${codigo}.`);
    } finally {
      setProcesando(null);
    }
  }

  async function vaciarBaseDeDatos() {
    const escrito = window.prompt(
      `Esto elimina TODOS los tickets (${tickets.length} en este momento) de forma permanente.\n\nEscribe ELIMINAR para confirmar:`
    );
    if (escrito !== "ELIMINAR") return;

    setProcesando("__vaciar__");
    try {
      const res = await fetch(`/api/admin/tickets?confirmacion=ELIMINAR`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await cargar();
    } catch {
      setError("No se pudo vaciar la base de datos.");
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
          placeholder="Buscar por codigo, nombre o area..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <a
          href={`/api/admin/export/excel?fecha=${new Date().toISOString().slice(0, 10)}`}
          className="btn-secondary ml-auto"
        >
          Exportar Excel de hoy
        </a>
        <button
          onClick={vaciarBaseDeDatos}
          disabled={procesando === "__vaciar__"}
          className="btn-danger"
        >
          <IconTrash className="h-4 w-4" />
          {procesando === "__vaciar__" ? "Vaciando..." : "Vaciar base de datos"}
        </button>
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
                    <PrioridadBadge prioridad={t.prioridad} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {t.nombreSolicitante} · {t.area} · {t.categoria}
                  </p>
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
                  <button
                    onClick={() => eliminarTicket(t.id, t.codigoTicket)}
                    disabled={procesando === t.id}
                    title="Eliminar ticket"
                    aria-label="Eliminar ticket"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
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
