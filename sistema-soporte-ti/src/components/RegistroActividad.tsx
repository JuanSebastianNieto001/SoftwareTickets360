"use client";

// Bitacora del panel del lider de TI: quien hizo que y cuando.
//
// Los datos vienen de /api/admin/registro, que verifica el rol ADMIN. Se
// carga bajo demanda (no con polling como el listado de tickets) porque es
// una consulta de revision, no algo que se mire todo el dia.
import { useCallback, useEffect, useState } from "react";
import { ETIQUETA_ACCION, type Accion } from "@/lib/registro";
import { formatearFechaHora } from "@/lib/ticket";

type Registro = {
  id: string;
  fecha: string;
  usuarioId: string | null;
  usuarioNombre: string;
  accion: string;
  detalle: string;
  ticketCodigo: string | null;
};

/** Acciones que conviene resaltar: son las que destruyen o dan acceso. */
const ACCIONES_SENSIBLES = new Set([
  "TICKET_ELIMINADO",
  "TICKETS_ELIMINADOS",
  "USUARIO_CREADO",
  "PASSWORD_RESTABLECIDA",
]);

export default function RegistroActividad() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  // "" = todas las personas.
  const [filtroUsuario, setFiltroUsuario] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ limite: "200" });
      if (filtroUsuario) params.set("usuarioId", filtroUsuario);
      const res = await fetch(`/api/admin/registro?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo cargar la bitacora");
        return;
      }
      setRegistros(data.registros);
      setError("");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }, [filtroUsuario]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Las personas que aparecen en la bitacora cargada, para el selector. Se
  // sacan de los propios registros y no de /api/admin/usuarios porque aqui
  // interesa quien tiene actividad, incluidas cuentas ya eliminadas.
  const personas = Array.from(
    new Map(
      registros
        .filter((r) => r.usuarioId)
        .map((r) => [r.usuarioId as string, r.usuarioNombre])
    )
  );

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-950">Registro de actividad</h2>
          <p className="text-sm text-slate-500">Lo que ha hecho cada quien en el sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* El selector solo aparece cuando hay mas de una persona con
              actividad: con una sola no filtra nada. */}
          {personas.length > 1 && (
            <select
              className="input w-auto"
              id="filtro-usuario"
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
            >
              <option value="">Todas las personas</option>
              {personas.map(([id, nombre]) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
          )}
          <button className="btn-secondary" onClick={cargar} disabled={cargando}>
            {cargando ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!error && !cargando && registros.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          Todavia no hay actividad registrada. Aparecera aqui a medida que se use el sistema.
        </p>
      )}

      {registros.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-200">
          {registros.map((r) => (
            <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 text-sm">
              <span className="w-36 shrink-0 text-xs tabular-nums text-slate-500">
                {formatearFechaHora(r.fecha)}
              </span>
              <span className="font-medium text-slate-900">{r.usuarioNombre}</span>
              <span
                className={
                  ACCIONES_SENSIBLES.has(r.accion)
                    ? "badge bg-red-100 text-red-800"
                    : "badge bg-slate-100 text-slate-700"
                }
              >
                {ETIQUETA_ACCION[r.accion as Accion] ?? r.accion}
              </span>
              <span className="text-slate-600">{r.detalle}</span>
              {r.ticketCodigo && (
                <span className="font-mono text-xs text-brand-700">{r.ticketCodigo}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
