# Sistema de Gestion de Soportes TI

Aplicacion web para gestionar tickets de soporte tecnico interno: un enlace
publico donde cualquier colaborador crea un ticket sin necesidad de iniciar
sesion, y un panel privado autenticado donde el administrador de soporte
gestiona, atiende y cierra esos tickets.

Implementa la propuesta descrita en `../PROPUESTA_SISTEMA_SOPORTE_TI/`.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma ORM** sobre **SQLite** en desarrollo (archivo local, cero costo,
  cero configuracion). El esquema esta listo para migrar a **PostgreSQL /
  Supabase** en produccion sin cambiar una sola linea de codigo de la app.
- Autenticacion propia por cookie firmada (JWT con `jose`) + `bcryptjs` para
  contrasenas. Un solo rol: administrador.
- `exceljs` para la exportacion diaria de tickets cerrados a Excel.

## Reglas de negocio implementadas

- El colaborador crea un ticket desde `/` sin autenticarse.
- El ticket pasa por tres estados: **PENDIENTE → EN PROCESO → CERRADO**.
- El administrador es el unico usuario autenticado (`/admin`).
- Al presionar **"Voy en camino"** el ticket pasa a EN PROCESO y se registra
  la fecha de inicio y el tiempo de llegada (minutos desde la creacion).
- Al **cerrar** el ticket (con la solucion aplicada) se registra la fecha de
  cierre, el tiempo de resolucion (desde el inicio) y el tiempo total (desde
  la creacion).
- Exportacion a Excel de los tickets cerrados de un dia especifico
  (`/api/admin/export/excel?fecha=YYYY-MM-DD`, por defecto hoy). Botón
  disponible directamente en el panel.
- Limpieza progresiva: `POST /api/admin/limpieza?dias=30` borra tickets
  cerrados con mas de N dias (para no saturar el plan gratuito de la base de
  datos). Pensado para llamarse desde una tarea programada (cron) o
  manualmente.
- Seguimiento publico de un ticket por su codigo en `/seguimiento`, sin
  exponer datos del solicitante.

## Puesta en marcha (desarrollo local)

Requisitos: Node.js 18+.

```bash
cd sistema-soporte-ti
npm install
cp .env.example .env      # y ajusta AUTH_SECRET / credenciales del admin
npx prisma migrate dev    # crea prisma/dev.db con el esquema
npm run seed               # crea el usuario administrador + un ticket de ejemplo
npm run dev
```

Abre `http://localhost:3000`:

- Formulario publico de tickets: `http://localhost:3000/`
- Seguimiento por codigo: `http://localhost:3000/seguimiento`
- Panel administrador: `http://localhost:3000/admin/login`
  (credenciales definidas en `.env`: `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

## Variables de entorno (`.env`)

| Variable | Descripcion |
|---|---|
| `DATABASE_URL` | Cadena de conexion de la base de datos. `file:./dev.db` para SQLite local. |
| `AUTH_SECRET` | Cadena larga y aleatoria usada para firmar la sesion del admin. Cambiala en produccion. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NOMBRE` | Usadas solo por `npm run seed` para crear/actualizar el usuario administrador. |

## Pasar a Supabase / PostgreSQL en produccion

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En `prisma/schema.prisma` cambia:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Copia la *connection string* desde Supabase (Settings → Database) a
   `DATABASE_URL` en tus variables de entorno de produccion.
4. Corre `npx prisma migrate deploy` para crear las tablas.
5. Corre `npm run seed` una vez para crear el administrador.
6. Despliega en [Vercel](https://vercel.com) (plan gratuito): conecta el
   repositorio, configura las variables de entorno anteriores y listo.

Los campos `estado`, `rol` y `prioridad` se guardan como texto (no como enum
nativo) precisamente para que el esquema sea compatible tanto con SQLite
(desarrollo) como con PostgreSQL (produccion) sin tocar nada. Los valores
permitidos se validan en la aplicacion (`src/lib/ticket.ts`,
`src/lib/validation.ts`).

## Estructura del proyecto

```
src/
  app/
    page.tsx                 Formulario publico de creacion de tickets
    seguimiento/page.tsx      Consulta publica de estado por codigo
    admin/login/page.tsx      Login del administrador
    admin/page.tsx            Panel (protegido)
    api/tickets/               Crear ticket (POST) — publico
    api/tickets/consulta/      Consultar por codigo (GET) — publico
    api/auth/                  Login / logout
    api/admin/tickets/         Listado y acciones (iniciar/cerrar) — protegido
    api/admin/export/excel/    Exportacion Excel — protegido
    api/admin/limpieza/        Limpieza de tickets antiguos — protegido
  components/                 UI (formulario, dashboard, badges, etc.)
  lib/                        Prisma client, auth, validaciones, utilidades
  middleware.ts                Protege /admin y /api/admin verificando la cookie
prisma/
  schema.prisma                Modelo de datos (User, Ticket)
  seed.ts                      Crea el administrador inicial
```

## Seguridad — pendiente antes de exponer a internet

- El proyecto usa Next.js 14.2.35 (ultimo parche de la rama 14.x). El
  `npm audit` sigue mostrando avisos de severidad alta/moderada que solo se
  resuelven migrando a Next 15/16 (cambio con breaking changes en las APIs
  de `cookies()`/`searchParams`, no incluido en este entregable). Antes de
  un despliegue publico de produccion, evaluar esa migracion o las
  mitigaciones especificas de cada aviso (`npm audit` para el detalle).
- Define un `AUTH_SECRET` fuerte y una contrasena de administrador robusta
  antes de desplegar; los valores de `.env.example` son solo de ejemplo.

## Proximos pasos sugeridos (fuera del alcance del MVP)

Ver `../PROPUESTA_SISTEMA_SOPORTE_TI/09_Plan_Desarrollo/` y
`11_Documentacion/`: notificaciones por correo, paneles estadisticos,
exportacion avanzada, roles adicionales.
