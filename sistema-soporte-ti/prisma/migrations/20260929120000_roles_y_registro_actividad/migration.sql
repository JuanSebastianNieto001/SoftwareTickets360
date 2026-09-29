-- Dos perfiles (ADMIN y SOPORTE) y bitacora de actividad.
--
-- Nada de esto toca los tickets ni los usuarios existentes:
--   - Cambiar el DEFAULT de "rol" no reescribe las filas ya guardadas. La
--     cuenta que hoy existe tiene rol = 'ADMIN' escrito explicitamente, asi
--     que sigue siendo administrador despues de la migracion.
--   - "RegistroActividad" es una tabla nueva, vacia al crearse.
--
-- El default pasa a SOPORTE porque las cuentas que se crean desde el panel
-- son de soporte; la de administrador se siembra con el seed.
ALTER TABLE "User" ALTER COLUMN "rol" SET DEFAULT 'SOPORTE';

-- CreateTable
CREATE TABLE "RegistroActividad" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "usuarioNombre" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "ticketCodigo" TEXT,

    CONSTRAINT "RegistroActividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistroActividad_fecha_idx" ON "RegistroActividad"("fecha");

-- CreateIndex
CREATE INDEX "RegistroActividad_usuarioId_idx" ON "RegistroActividad"("usuarioId");

-- AddForeignKey
-- ON DELETE SET NULL y no CASCADE: si se elimina una cuenta, su rastro de
-- actividad debe quedar (el nombre sigue guardado en "usuarioNombre").
ALTER TABLE "RegistroActividad" ADD CONSTRAINT "RegistroActividad_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- La tabla nueva nace en el esquema public, asi que hereda el mismo
-- endurecimiento que el resto (ver 20260914000000_habilitar_rls): RLS
-- activo, sin politicas, y sin privilegios para los roles publicos.
ALTER TABLE "RegistroActividad" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON "RegistroActividad" FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON "RegistroActividad" FROM authenticated';
  END IF;
END
$$;
