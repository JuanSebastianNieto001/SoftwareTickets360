-- Endurecimiento de seguridad para la base de datos en Supabase.
--
-- Contexto: Prisma crea las tablas sin Row Level Security (RLS). En Supabase,
-- el esquema "public" queda expuesto por la Data API (PostgREST) y los roles
-- "anon" y "authenticated" heredan privilegios sobre cada tabla nueva que crea
-- el rol "postgres". El resultado es que, sin esta migracion, cualquiera con la
-- anon key del proyecto podia leer "User" (incluidos los passwordHash), crear
-- un usuario con rol ADMIN, o borrar todos los tickets.
--
-- Esta migracion cierra eso en tres capas. Es idempotente: se puede aplicar
-- sobre una base donde ya se ejecuto a mano, sin error.
--
-- Nota: la app NO se ve afectada. Prisma se conecta con el rol "postgres", que
-- tiene BYPASSRLS y ademas es dueño de las tablas, asi que sigue leyendo y
-- escribiendo con normalidad. No se definen politicas a proposito: con RLS
-- activo y cero politicas, Postgres deniega por defecto a todo lo demas.

-- 1) Activar RLS. Sin politicas = nadie accede, salvo el dueño/BYPASSRLS.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- 2) Quitar los privilegios de tabla a los roles publicos de Supabase.
--    Va dentro de un bloque condicional porque los roles "anon" y
--    "authenticated" solo existen en Supabase: en un Postgres local (o en
--    SQLite para desarrollo) no estan, y un REVOKE sobre un rol inexistente
--    abortaria la migracion.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON "User" FROM anon';
    EXECUTE 'REVOKE ALL ON "Ticket" FROM anon';
    EXECUTE 'REVOKE ALL ON "_prisma_migrations" FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON "User" FROM authenticated';
    EXECUTE 'REVOKE ALL ON "Ticket" FROM authenticated';
    EXECUTE 'REVOKE ALL ON "_prisma_migrations" FROM authenticated';
  END IF;
END
$$;

-- 3) Evitar que el problema reaparezca. Supabase define privilegios por
--    defecto que otorgan acceso a "anon"/"authenticated" sobre cada tabla
--    nueva creada por "postgres". Sin esto, el proximo modelo que se agregue
--    en Prisma naceria expuesta otra vez.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
  END IF;
END
$$;
