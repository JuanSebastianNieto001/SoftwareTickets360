"use client";

import { useState, FormEvent } from "react";
import { AREAS, CATEGORIAS, PRIORIDADES } from "@/lib/ticket";
import { IconUser, IconPin, IconTag, IconFlag, IconMessage, IconSend } from "@/components/icons";

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
            <IconUser className="h-4 w-4 text-brand-500" />
            Nombre completo
          </label>
          <input
            className="input"
            id="nombreSolicitante"
            name="nombreSolicitante"
            placeholder="Ingresa tu nombre completo"
            required
            minLength={3}
          />
        </div>
        <div>
          <label className="label" htmlFor="area">
            <IconPin className="h-4 w-4 text-brand-500" />
            Area
          </label>
          <select className="input" id="area" name="area" required defaultValue="">
            <option value="" disabled>
              Selecciona una opcion
            </option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="categoria">
            <IconTag className="h-4 w-4 text-brand-500" />
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
        <div>
          <label className="label" htmlFor="prioridad">
            <IconFlag className="h-4 w-4 text-brand-500" />
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
          <IconMessage className="h-4 w-4 text-brand-500" />
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
        <IconSend className="h-4 w-4" />
        {estado.paso === "enviando" ? "Enviando..." : "Crear ticket"}
      </button>
    </form>
  );
}
