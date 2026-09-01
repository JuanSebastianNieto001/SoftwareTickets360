"use client";

import { useState, FormEvent } from "react";
import { CATEGORIAS, PRIORIDADES } from "@/lib/ticket";

type Estado =
  | { paso: "formulario" }
  | { paso: "enviando" }
  | { paso: "exito"; codigo: string }
  | { paso: "error"; mensaje: string };

export default function TicketForm() {
  const [estado, setEstado] = useState<Estado>({ paso: "formulario" });

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado({ paso: "enviando" });

    const form = new FormData(e.currentTarget);
    const payload = {
      nombreSolicitante: String(form.get("nombreSolicitante") ?? ""),
      correo: String(form.get("correo") ?? ""),
      area: String(form.get("area") ?? ""),
      categoria: String(form.get("categoria") ?? ""),
      prioridad: String(form.get("prioridad") ?? "MEDIA"),
      descripcion: String(form.get("descripcion") ?? ""),
    };

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setEstado({ paso: "error", mensaje: data.error ?? "No se pudo crear el ticket" });
        return;
      }
      setEstado({ paso: "exito", codigo: data.codigoTicket });
    } catch {
      setEstado({ paso: "error", mensaje: "No se pudo conectar con el servidor. Intenta de nuevo." });
    }
  }

  if (estado.paso === "exito") {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          ✓
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Ticket creado</h2>
        <p className="mt-1 text-sm text-slate-600">
          Guarda este codigo para consultar el estado de tu solicitud:
        </p>
        <p className="mt-3 rounded-lg bg-slate-100 py-3 text-2xl font-bold tracking-wide text-brand-700">
          {estado.codigo}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <a href={`/seguimiento?codigo=${estado.codigo}`} className="btn-primary">
            Consultar estado
          </a>
          <button className="btn-secondary" onClick={() => setEstado({ paso: "formulario" })}>
            Crear otro ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="card space-y-4 p-6">
      {estado.paso === "error" && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{estado.mensaje}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nombreSolicitante">
            Nombre completo
          </label>
          <input className="input" id="nombreSolicitante" name="nombreSolicitante" required minLength={3} />
        </div>
        <div>
          <label className="label" htmlFor="correo">
            Correo electronico
          </label>
          <input className="input" id="correo" name="correo" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="area">
            Area o departamento
          </label>
          <input className="input" id="area" name="area" required minLength={2} />
        </div>
        <div>
          <label className="label" htmlFor="categoria">
            Categoria del problema
          </label>
          <select className="input" id="categoria" name="categoria" required defaultValue="">
            <option value="" disabled>
              Selecciona una opcion
            </option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="prioridad">
            Prioridad
          </label>
          <select className="input" id="prioridad" name="prioridad" defaultValue="MEDIA">
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {p === "BAJA" ? "Baja" : p === "MEDIA" ? "Media" : "Alta"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="descripcion">
          Descripcion del problema
        </label>
        <textarea
          className="input min-h-[120px]"
          id="descripcion"
          name="descripcion"
          required
          minLength={10}
          placeholder="Cuentanos que esta pasando, desde cuando y que equipo o sistema esta involucrado."
        />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={estado.paso === "enviando"}>
        {estado.paso === "enviando" ? "Enviando..." : "Crear ticket"}
      </button>
    </form>
  );
}
