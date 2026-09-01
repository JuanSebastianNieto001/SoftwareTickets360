"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

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
          Correo
        </label>
        <input className="input" id="correo" name="correo" type="email" required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Contrasena
        </label>
        <input className="input" id="password" name="password" type="password" required />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={cargando}>
        {cargando ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
