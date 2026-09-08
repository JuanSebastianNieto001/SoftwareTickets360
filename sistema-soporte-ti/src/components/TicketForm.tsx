"use client";

// Formulario publico de creacion de tickets (src/app/page.tsx). No pide
// correo ni login: el unico dato de contacto es el nombre. Las opciones de
// area y categoria salen de src/lib/ticket.ts, asi que agregar un valor
// nuevo ahi se refleja automaticamente aqui sin tocar este archivo.
//
// La prioridad no se pide: se deduce de la categoria elegida. Aqui solo se
// muestra como anticipo; el valor que se guarda lo calcula el servidor.
import { useState, FormEvent } from "react";
import {
  AREA_CON_TEAM_LEADER,
  AREAS,
  CATEGORIAS,
  TEAM_LEADERS,
  prioridadParaCategoria,
} from "@/lib/ticket";
import PrioridadBadge from "@/components/PrioridadBadge";
import { IconUser, IconPuesto, IconPin, IconTag, IconPeople, IconMessage, IconSend } from "@/components/icons";

type Estado =
  | { paso: "formulario" }
  | { paso: "enviando" }
  | { paso: "exito"; codigo: string }
  | { paso: "error"; mensaje: string };

export default function TicketForm() {
  const [estado, setEstado] = useState<Estado>({ paso: "formulario" });
  // Se controla en estado (en vez de dejarlo suelto como los demas campos)
  // para poder descartar cualquier caracter que no sea digito mientras se
  // escribe o se pega, no solo al enviar.
  const [numeroPuesto, setNumeroPuesto] = useState("");
  // Se guarda solo para poder mostrar la prioridad que le va a corresponder.
  const [categoria, setCategoria] = useState("");
  // El area se controla porque de ella depende que se pida o no el team leader.
  const [area, setArea] = useState("");
  const pideTeamLeader = area === AREA_CON_TEAM_LEADER;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado({ paso: "enviando" });

    const form = new FormData(e.currentTarget);
    const payload = {
      nombreSolicitante: String(form.get("nombreSolicitante") ?? ""),
      numeroPuesto: String(form.get("numeroPuesto") ?? ""),
      area: String(form.get("area") ?? ""),
      teamLeader: String(form.get("teamLeader") ?? ""),
      categoria: String(form.get("categoria") ?? ""),
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
          <button
            className="btn-secondary"
            onClick={() => {
              setNumeroPuesto("");
              setCategoria("");
              setArea("");
              setEstado({ paso: "formulario" });
            }}
          >
            Crear otro ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="card space-y-3 p-5">
      {estado.paso === "error" && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{estado.mensaje}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
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
          <select
            className="input"
            id="area"
            name="area"
            required
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
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

        {/* Solo para asesores: sirve para saber que team leader concentra mas
            tickets. En Administrativos ni se pide ni se guarda. */}
        {pideTeamLeader && (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="teamLeader">
              <IconPeople className="h-4 w-4 text-brand-500" />
              Team leader
            </label>
            <select className="input" id="teamLeader" name="teamLeader" required defaultValue="">
              <option value="" disabled>
                Selecciona tu team leader
              </option>
              {TEAM_LEADERS.map((lider) => (
                <option key={lider} value={lider}>
                  {lider}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label" htmlFor="numeroPuesto">
            <IconPuesto className="h-4 w-4 text-brand-500" /># del Puesto
          </label>
          <input
            className="input"
            id="numeroPuesto"
            name="numeroPuesto"
            inputMode="numeric"
            placeholder="Ej. 12"
            required
            maxLength={10}
            value={numeroPuesto}
            onChange={(e) => setNumeroPuesto(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </div>
        <div>
          <label className="label" htmlFor="categoria">
            <IconTag className="h-4 w-4 shrink-0 text-brand-500" />
            Categoria
            {categoria && (
              <span className="ml-auto flex shrink-0 items-center gap-1.5 font-normal text-slate-500">
                Prioridad
                <PrioridadBadge prioridad={prioridadParaCategoria(categoria)} />
              </span>
            )}
          </label>
          <select
            className="input"
            id="categoria"
            name="categoria"
            required
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
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
      </div>

      <div>
        <label className="label" htmlFor="descripcion">
          <IconMessage className="h-4 w-4 text-brand-500" />
          Descripcion del problema
        </label>
        <textarea
          className="input min-h-[70px]"
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
