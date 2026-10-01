"use client";

// Gestion de cuentas del panel del lider de TI: ver quien tiene acceso,
// cuantos tickets ha atendido cada quien, crear una cuenta de soporte nueva
// y restablecerle la contrasena a quien la olvido.
//
// Todo lo que se muestra aqui viene de /api/admin/usuarios, que ya verifica
// el rol: si un soporte llamara esa ruta a mano recibiria 403. Esconder la
// seccion es comodidad, no la barrera.
import { useCallback, useEffect, useState, FormEvent } from "react";
import { formatearFechaHora } from "@/lib/ticket";
import { MIN_CARACTERES_PASSWORD } from "@/lib/validation";

type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  creadoEn: string;
  ticketsAtendidos: number;
  esTuCuenta: boolean;
};

export default function PanelUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  // Id de la cuenta cuyo formulario de restablecimiento esta abierto.
  const [restableciendo, setRestableciendo] = useState<string | null>(null);
  const [passwordNueva, setPasswordNueva] = useState("");
  const [creando, setCreando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/usuarios");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudieron cargar las cuentas");
        return;
      }
      setUsuarios(data.usuarios);
      setError("");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearCuenta(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setProcesando(true);
    setError("");
    setAviso("");

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: String(form.get("nombre") ?? ""),
          correo: String(form.get("correo") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la cuenta");
        return;
      }
      setAviso(`Cuenta de ${data.usuario.nombre} creada. Ya puede ingresar en /soporte.`);
      setCreando(false);
      (e.target as HTMLFormElement).reset();
      await cargar();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setProcesando(false);
    }
  }

  async function restablecer(usuario: Usuario) {
    setProcesando(true);
    setError("");
    setAviso("");

    try {
      const res = await fetch(`/api/admin/usuarios/${usuario.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordNueva }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo restablecer la contrasena");
        return;
      }
      setAviso(`Contrasena de ${usuario.nombre} restablecida. Entregasela por un canal seguro.`);
      setRestableciendo(null);
      setPasswordNueva("");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-950">Cuentas</h2>
          <p className="text-sm text-slate-500">Quien puede entrar al sistema y que ha atendido.</p>
        </div>
        <button className="btn-secondary" onClick={() => setCreando((v) => !v)}>
          {creando ? "Cancelar" : "Crear cuenta de soporte"}
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {aviso && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{aviso}</p>
      )}

      {creando && (
        <form onSubmit={crearCuenta} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="nuevo-nombre">
              Nombre completo
            </label>
            <input className="input" id="nuevo-nombre" name="nombre" required minLength={3} />
          </div>
          <div>
            <label className="label" htmlFor="nuevo-correo">
              Correo
            </label>
            <input
              className="input"
              id="nuevo-correo"
              name="correo"
              type="email"
              required
              placeholder="nombre@voz360.co"
            />
          </div>
          <div>
            <label className="label" htmlFor="nuevo-password">
              Contrasena
            </label>
            <input
              className="input"
              id="nuevo-password"
              name="password"
              type="password"
              required
              minLength={MIN_CARACTERES_PASSWORD}
              placeholder={`Minimo ${MIN_CARACTERES_PASSWORD} caracteres`}
            />
          </div>
          <div className="sm:col-span-3">
            <button className="btn-primary" type="submit" disabled={procesando}>
              {procesando ? "Creando..." : "Crear cuenta"}
            </button>
            <p className="mt-2 text-xs text-slate-500">
              La cuenta se crea con perfil de soporte: puede atender y consultar tickets, pero no
              borrarlos.
            </p>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="mt-4 text-sm text-slate-500">Cargando cuentas...</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {usuarios.map((u) => (
            <li key={u.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">
                    {u.nombre}
                    <span
                      className={`ml-2 ${
                        u.rol === "ADMIN"
                          ? "badge bg-brand-100 text-brand-700"
                          : "badge bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.rol === "ADMIN" ? "Administrador" : "Soporte"}
                    </span>
                  </p>
                  <p className="text-sm text-slate-500">{u.correo}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {u.ticketsAtendidos} {u.ticketsAtendidos === 1 ? "ticket atendido" : "tickets atendidos"}
                    {" · desde "}
                    {formatearFechaHora(u.creadoEn)}
                  </p>
                </div>
                {/* La propia cuenta no se restablece desde aqui: el servidor
                    tambien lo rechaza, esto solo evita el intento. */}
                {!u.esTuCuenta && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setRestableciendo(restableciendo === u.id ? null : u.id);
                      setPasswordNueva("");
                    }}
                  >
                    {restableciendo === u.id ? "Cancelar" : "Restablecer contrasena"}
                  </button>
                )}
              </div>

              {restableciendo === u.id && (
                <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
                  <div className="flex-1">
                    <label className="label" htmlFor={`password-${u.id}`}>
                      Contrasena nueva para {u.nombre}
                    </label>
                    <input
                      className="input"
                      id={`password-${u.id}`}
                      type="password"
                      value={passwordNueva}
                      minLength={MIN_CARACTERES_PASSWORD}
                      placeholder={`Minimo ${MIN_CARACTERES_PASSWORD} caracteres`}
                      onChange={(e) => setPasswordNueva(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-primary"
                    disabled={procesando || passwordNueva.length < MIN_CARACTERES_PASSWORD}
                    onClick={() => restablecer(u)}
                  >
                    {procesando ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
