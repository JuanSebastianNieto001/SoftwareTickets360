"use client";

// Formulario de login del panel de administrador (src/app/admin/login).
// Al iniciar sesion, redirige a `next` si viene de un intento de entrar a
// una ruta protegida sin sesion (ver el `?next=` que agrega middleware.ts),
// o a /admin por defecto.
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconUser, IconLock } from "@/components/icons";

export default function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      correo: String(form.get("correo") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesion");
        setCargando(false);
        return;
      }
      router.push(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="card space-y-4 p-6">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div>
        <label className="label" htmlFor="correo">
          <IconUser className="h-4 w-4 text-brand-500" />
          Usuario
        </label>
        <input className="input" id="correo" name="correo" type="text" required autoFocus autoComplete="username" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          <IconLock className="h-4 w-4 text-brand-500" />
          Contrasena
        </label>
        <div className="relative">
          <input
            className="input pr-10"
            id="password"
            name="password"
            type={verPassword ? "text" : "password"}
            required
            autoComplete="current-password"
          />
          {/* Ojo mostrar/ocultar contrasena: cambia el `type` del input entre
              "password" y "text". tabIndex={-1} para que Tab salte directo
              del campo de contrasena al boton de enviar. */}
          <button
            type="button"
            onClick={() => setVerPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
            aria-label={verPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            tabIndex={-1}
          >
            {verPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full" disabled={cargando}>
        {cargando ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
