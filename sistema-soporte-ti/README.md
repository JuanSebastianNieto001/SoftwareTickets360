# Sistema de Gestion de Soportes TI

Aplicacion web para gestionar tickets de soporte tecnico interno: un enlace
publico donde cualquier colaborador crea un ticket sin necesidad de iniciar
sesion, y un panel privado autenticado donde el administrador de soporte
gestiona, atiende y cierra esos tickets.

Implementa la propuesta descrita en `../PROPUESTA_SISTEMA_SOPORTE_TI/`.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma ORM** sobre **PostgreSQL en Supabase**. Prisma habla directo con
  la base de datos de Supabase mediante su connection string — la app no usa
  el cliente `@supabase-js`/Auth de Supabase, tiene su propio sistema de
  sesion (mas simple porque solo hay un rol: administrador).
- Autenticacion propia por cookie firmada (JWT con `jose`) + `bcryptjs` para
  contrasenas.
- `exceljs` para la exportacion de tickets a Excel.
- Desplegado en **Vercel** (plan gratuito).

## Reglas de negocio implementadas

- El colaborador crea un ticket desde `/` sin autenticarse.
- El ticket pasa por tres estados: **PENDIENTE → EN PROCESO → CERRADO**.
- El administrador es el unico usuario autenticado (`/admin`).
- Al presionar **"Voy en camino"** el ticket pasa a EN PROCESO y se registra
  la fecha de inicio y el tiempo de llegada (minutos desde la creacion).
- Al **cerrar** el ticket (con la solucion aplicada) se registra la fecha de
  cierre, el tiempo de resolucion (desde el inicio) y el tiempo total (desde
  la creacion).
- La **prioridad no la elige quien reporta**: se asigna sola segun la
  categoria (tabla `PRIORIDAD_POR_CATEGORIA` en `src/lib/ticket.ts`).
  Hardware, Software, Red / Internet y Accesos y credenciales → ALTA;
  Correo electronico → MEDIA; Impresoras y Otro → BAJA. Aplica igual para
  las dos areas. El servidor la calcula e ignora cualquier prioridad que
  venga en la peticion.
- En el panel, un ticket cerrado muestra solo **cuanto tomo resolverlo**
  (desde "Voy en camino" hasta el cierre). El tiempo de llegada y el total
  se siguen guardando y salen en el Excel.
- Exportacion a Excel de **todos** los tickets que haya en la base en ese
  momento (`/api/admin/export/excel`), sin filtrar por fecha ni por estado:
  el flujo es exportar y luego vaciar, y a veces se vacia cada 2 o 3 dias.
  Boton disponible directamente en el panel.
- Limpieza progresiva: `POST /api/admin/limpieza?dias=30` borra tickets
  cerrados con mas de N dias (para no saturar el plan gratuito de la base de
  datos). Pensado para llamarse desde una tarea programada (cron) o
  manualmente.
- Seguimiento publico de un ticket por su codigo en `/seguimiento`, sin
  exponer datos del solicitante.

## Puesta en marcha (desarrollo local)

Requisitos: Node.js 18+ y un proyecto de Supabase (gratuito).

```bash
cd sistema-soporte-ti
npm install
cp .env.example .env      # y pon DATABASE_URL, DIRECT_URL, AUTH_SECRET, credenciales del admin
npx prisma migrate dev --name init   # crea las tablas en Supabase
npm run seed               # crea el usuario administrador + un ticket de ejemplo
npm run dev
```

Abre `http://localhost:3000`:

- Formulario publico de tickets: `http://localhost:3000/`
- Seguimiento por codigo: `http://localhost:3000/seguimiento`
- Panel administrador: `http://localhost:3000/admin/login`
  (credenciales definidas en `.env`: `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

## Variables de entorno

| Variable | Descripcion |
|---|---|
| `DATABASE_URL` | Connection string agrupada de Supabase (pooler, puerto 6543). La usa la app en runtime. |
| `DIRECT_URL` | Connection string directa de Supabase (puerto 5432). La usa Prisma solo para migraciones. |
| `AUTH_SECRET` | Cadena larga y aleatoria usada para firmar la sesion del admin. Distinta en cada entorno. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NOMBRE` | Usadas solo por `npm run seed` para crear/actualizar el usuario administrador. |

Ambas connection strings de Supabase estan en el dashboard del proyecto:
**Project Settings → Database → Connection string** (pestaña "Nodejs" /
formato URI). Ahi mismo puedes resetear la contrasena de la base de datos si
la perdiste.

Los campos `estado`, `rol` y `prioridad` se guardan como texto (no como enum
nativo de PostgreSQL) para simplificar; los valores permitidos se validan en
la aplicacion (`src/lib/ticket.ts`, `src/lib/validation.ts`).

## Desplegar en Vercel

1. En [vercel.com/new](https://vercel.com/new), importa el repositorio de
   GitHub (`SoftwareTickets360`), con **Root Directory = `sistema-soporte-ti`**
   (el repo tiene el proyecto en un subdirectorio).
2. En Environment Variables, agrega las mismas 6 variables de la tabla de
   arriba (con los valores reales de Supabase y un `AUTH_SECRET` distinto al
   de desarrollo).
3. Deploy. Vercel detecta Next.js automaticamente; el script `postinstall`
   corre `prisma generate` en cada build.
4. Antes del primer uso en produccion, corre una vez desde tu maquina (con
   `DATABASE_URL`/`DIRECT_URL` de produccion en tu `.env`):
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```
   (las migraciones no se corren automaticamente en el build de Vercel, para
   evitar aplicarlas por accidente en cada deploy).

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
  lib/                        Prisma client, auth, validaciones, dominio
    ticket.ts                 Catalogos y reglas puras (sin base de datos:
                              lo importan componentes de cliente)
    codigoTicket.ts           Generacion del codigo TCK-xxxxxx (usa Prisma)
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
