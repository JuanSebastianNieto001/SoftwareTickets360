"use client";

// Panel del administrador (src/app/admin/page.tsx): lista, filtra, avanza
// el estado (PENDIENTE -> EN_PROCESO -> CERRADO), cierra con solucion y
// elimina tickets. Se refresca solo con polling en vez de websockets/SSE,
// que hubiera sido mas trabajo para un MVP con un solo admin viendo la
// pantalla.
//
// El polling esta acotado a proposito, porque el plan gratuito de Supabase
// tiene 5 GB de egress al mes y recargar la lista completa cada pocos
// segundos se los come:
//   - la vista inicial solo trae los ACTIVOS, no el historial completo;
//   - el listado no incluye la solucion (el campo mas pesado), se pide
//     aparte al abrir un ticket;
//   - no se consulta si la pestana no esta visible;
//   - en Finalizados no se consulta en bucle: es historial, no cambia solo.
import { useCallback, useEffect, useRef, useState } from "react";
import EstadoBadge from "@/components/EstadoBadge";
import PrioridadBadge from "@/components/PrioridadBadge";
import { IconTrash } from "@/components/icons";
import { TEAM_LEADERS, formatearFechaHora, formatearMinutos } from "@/lib/ticket";

const INTERVALO_ACTUALIZACION_MS = 20000;
// Espera antes de buscar mientras se escribe, para no lanzar una consulta a
// la base por cada tecla.
const RETARDO_BUSQUEDA_MS = 350;

type Contadores = { PENDIENTE: number; EN_PROCESO: number; CERRADO: number };

const CONTADORES_VACIOS: Contadores = { PENDIENTE: 0, EN_PROCESO: 0, CERRADO: 0 };

/** Lo que trae el listado. Sin `solucion`: esa llega en TicketDetalle. */
type Ticket = {
  id: string;
  codigoTicket: string;
  nombreSolicitante: string;
  numeroPuesto: string;
  area: string;
  /** Vacio en los tickets de Administrativos. */
  teamLeader: string;
  categoria: string;
  descripcion: string;
  estado: "PENDIENTE" | "EN_PROCESO" | "CERRADO";
  prioridad: string;
  fechaCreacion: string;
  fechaInicio: string | null;
  fechaCierre: string | null;
  tiempoResolucion: number | null;
  admin: { nombre: string } | null;
};

/** Lo que se pide bajo demanda al abrir un ticket finalizado. */
type TicketDetalle = { solucion: string | null };

const FILTROS = [
  { valor: "ACTIVOS", etiqueta: "Activos" },
  { valor: "PENDIENTE", etiqueta: "Pendientes" },
  { valor: "EN_PROCESO", etiqueta: "En proceso" },
  { valor: "CERRADO", etiqueta: "Finalizados" },
] as const;

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [contadores, setContadores] = useState<Contadores>(CONTADORES_VACIOS);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["valor"]>("ACTIVOS");
  // Soluciones ya descargadas, por id de ticket. Se cachean para no volver a
  // pedirlas cada vez que se abre y cierra el mismo ticket.
  const [detalles, setDetalles] = useState<Record<string, TicketDetalle>>({});
  const [detalleAbierto, setDetalleAbierto] = useState<string | null>(null);
  // "" = todos los lideres. Tickets por lider en toda la tabla, para ver de
  // un vistazo cual concentra mas.
  const [teamLeader, setTeamLeader] = useState("");
  const [porTeamLeader, setPorTeamLeader] = useState<Record<string, number>>({});
  // `busqueda` es lo que se ve en el input; `busquedaAplicada` es lo que
  // realmente se manda al servidor, con retardo (ver RETARDO_BUSQUEDA_MS).
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
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
    // Siempre se manda un estado: ya no hay vista "Todos" que traiga tambien
    // el historial completo. La inicial (ACTIVOS) solo pide lo que esta sin
    // resolver, que es lo unico que cambia mientras el panel esta abierto.
    const params = new URLSearchParams({ estado: filtro });
    if (busquedaAplicada) params.set("q", busquedaAplicada);
    if (teamLeader) params.set("teamLeader", teamLeader);
    try {
      const res = await fetch(`/api/admin/tickets?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data.tickets);
      setContadores(data.contadores ?? CONTADORES_VACIOS);
      setPorTeamLeader(data.porTeamLeader ?? {});
      setError(null);
    } catch {
      setError("No se pudieron cargar los tickets.");
    } finally {
      setCargando(false);
      primeraCargaHecha.current = true;
    }
  }, [filtro, busquedaAplicada, teamLeader]);

  // Retarda lo que se escribe en el buscador antes de consultar.
  useEffect(() => {
    const temporizador = setTimeout(() => setBusquedaAplicada(busqueda.trim()), RETARDO_BUSQUEDA_MS);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  useEffect(() => {
    primeraCargaHecha.current = false;
    cargar();

    // Finalizados es historial: no cambia por su cuenta, no tiene sentido
    // reconsultarlo en bucle. Se refresca al entrar y despues de cada accion.
    if (filtro === "CERRADO") return;

    let intervalo: ReturnType<typeof setInterval> | null = null;

    const arrancar = () => {
      if (intervalo === null) intervalo = setInterval(cargar, INTERVALO_ACTUALIZACION_MS);
    };
    const detener = () => {
      if (intervalo !== null) {
        clearInterval(intervalo);
        intervalo = null;
      }
    };

    // Con la pestana en segundo plano nadie esta mirando: se deja de
    // consultar y se retoma (con una carga inmediata) al volver.
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible") {
        cargar();
        arrancar();
      } else {
        detener();
      }
    };

    if (document.visibilityState === "visible") arrancar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      detener();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [cargar, filtro]);

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

  /**
   * Abre o cierra el detalle de un ticket finalizado. La solucion no viene en
   * el listado, se pide aqui la primera vez y queda cacheada en `detalles`.
   */
  async function alternarDetalle(id: string) {
    if (detalleAbierto === id) {
      setDetalleAbierto(null);
      return;
    }
    setDetalleAbierto(id);
    if (detalles[id]) return;

    try {
      const res = await fetch(`/api/admin/tickets/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetalles((previos) => ({ ...previos, [id]: { solucion: data.ticket.solucion } }));
    } catch {
      setError("No se pudo cargar la solucion del ticket.");
      setDetalleAbierto(null);
    }
  }

  // Borra un ticket puntual. Usa window.confirm (simple si/no) porque es una
  // accion acotada a un solo registro; el borrado masivo de abajo pide algo
  // mas fuerte (escribir la palabra ELIMINAR) porque su radio de impacto es
  // mucho mayor.
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

  // Borra TODOS los tickets. Pide escribir literalmente "ELIMINAR" (no solo
  // aceptar/cancelar) para que un clic accidental no pueda vaciar la tabla;
  // el backend (DELETE /api/admin/tickets) tambien exige ese mismo texto
  // como query param, asi que la confirmacion esta duplicada en cliente y
  // servidor, no es solo cosmetica.
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
          placeholder="Buscar por codigo, nombre, puesto o area..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {/* El numero entre parentesis es el total historico de cada lider (no
            depende del filtro de estado), para comparar de un vistazo. */}
        <select
          className="input max-w-[15rem]"
          value={teamLeader}
          onChange={(e) => setTeamLeader(e.target.value)}
          aria-label="Filtrar por team leader"
        >
          <option value="">Todos los team leaders</option>
          {TEAM_LEADERS.map((lider) => (
            <option key={lider} value={lider}>
              {lider} ({porTeamLeader[lider] ?? 0})
            </option>
          ))}
        </select>
        {/* Descarga los finalizados con su solucion (todos los que haya en la
            base, sin filtro de fecha: a veces se vacia cada 2 o 3 dias). */}
        <a href="/api/admin/export/excel" className="btn-secondary ml-auto">
          Exportar finalizados
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
                    {t.nombreSolicitante}
                    {t.numeroPuesto ? ` · Puesto ${t.numeroPuesto}` : ""} · {t.area}
                    {t.teamLeader ? ` · TL ${t.teamLeader}` : ""} · {t.categoria}
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
                  {t.estado === "CERRADO" && (
                    <button className="btn-secondary" onClick={() => alternarDetalle(t.id)}>
                      {detalleAbierto === t.id ? "Ocultar solucion" : "Ver solucion"}
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
                <span>Creado: {formatearFechaHora(t.fechaCreacion)}</span>
                <span>Inicio: {formatearFechaHora(t.fechaInicio)}</span>
                <span>Cierre: {formatearFechaHora(t.fechaCierre)}</span>
                <span>Atendido por: {t.admin?.nombre ?? "-"}</span>
              </div>

              {/* Solo se muestra cuanto tomo resolverlo (desde "Voy en camino"
                  hasta el cierre). El tiempo de llegada y el total se siguen
                  calculando y guardando, y salen en el Excel, pero en el panel
                  confundian mas de lo que ayudaban. */}
              {t.estado === "CERRADO" && (
                <div className="mt-3 text-xs">
                  <span className="inline-block rounded bg-slate-50 px-2 py-1">
                    Se resolvio en: {formatearMinutos(t.tiempoResolucion)}
                  </span>
                </div>
              )}

              {/* La solucion no viaja en el listado: se descarga al abrirla. */}
              {t.estado === "CERRADO" && detalleAbierto === t.id && (
                <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  {detalles[t.id] ? (
                    <>
                      <strong>Solucion:</strong> {detalles[t.id].solucion || "(sin solucion registrada)"}
                    </>
                  ) : (
                    "Cargando solucion..."
                  )}
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
