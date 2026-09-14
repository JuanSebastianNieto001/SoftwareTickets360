"use client";

// Saludo del panel ("Hola, X") con el nombre del administrador editable en
// el sitio: se toca el lapiz, se escribe y se guarda.
//
// Ese nombre no es solo el del saludo: es el que queda como "Atendido por"
// en los tickets que cierra este usuario (y en la columna del Excel), asi
// que cambiarlo aqui tambien corrige como aparece en los tickets, incluidos
// los ya cerrados.
//
// El nombre inicial llega como prop desde el Server Component que lee la
// sesion (src/app/admin/page.tsx); despues de guardar se refresca la ruta
// para que el resto de la pantalla vea el valor nuevo.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconPencil } from "@/components/icons";
import { actualizarNombreAdminSchema } from "@/lib/validation";

export default function NombreAdmin({ nombreInicial }: { nombreInicial: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(nombreInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrirEdicion() {
    setBorrador(nombre);
    setError(null);
    setEditando(true);
  }

  function cancelar() {
    setEditando(false);
    setError(null);
  }

  async function guardar() {
    // Se valida con el mismo esquema que usa la API, no con una copia de la
    // regla, para que el mensaje sea el mismo en los dos lados.
    const resultado = actualizarNombreAdminSchema.safeParse({ nombre: borrador });
    if (!resultado.success) {
      setError(resultado.error.errors[0]?.message ?? "Nombre invalido");
      return;
    }

    // Sin cambios: no vale la pena ir al servidor.
    if (resultado.data.nombre === nombre) {
      setEditando(false);
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultado.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar el nombre.");
        return;
      }
      setNombre(data.nombre);
      setEditando(false);
      // La cookie de sesion ya trae el nombre nuevo: al refrescar, el saludo
      // renderizado en el servidor queda igual que lo que se ve aqui.
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (!editando) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-slate-500">
        Hola, <span className="font-medium text-slate-700">{nombre}</span>
        <button
          onClick={abrirEdicion}
          title="Cambiar mi nombre"
          aria-label="Cambiar mi nombre"
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-700"
        >
          <IconPencil className="h-3.5 w-3.5" />
        </button>
      </p>
    );
  }

  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          value={borrador}
          autoFocus
          maxLength={120}
          aria-label="Tu nombre"
          aria-invalid={Boolean(error)}
          onChange={(e) => {
            setBorrador(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") guardar();
            if (e.key === "Escape") cancelar();
          }}
        />
        <button className="btn-primary" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        <button className="btn-secondary" onClick={cancelar} disabled={guardando}>
          Cancelar
        </button>
      </div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          Asi apareceras como &quot;Atendido por&quot; en los tickets que cierres.
        </p>
      )}
    </div>
  );
}
