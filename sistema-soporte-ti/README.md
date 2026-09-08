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
- **Ningun campo puede quedar vacio**: el formulario no se envia y marca en
  rojo cada campo faltante con "Este campo es obligatorio". Si el campo tiene
  contenido pero invalido, muestra el motivo concreto (largo minimo, etc.).
  El `<form>` usa `noValidate` para reemplazar los globos nativos del
  navegador por estos mensajes.
- El ticket pasa por tres estados: **PENDIENTE → EN PROCESO → CERRADO**.
- El administrador es el unico usuario autenticado (`/admin`).
- Al presionar **"Voy en camino"** el ticket pasa a EN PROCESO y se registra
  la fecha de inicio y el tiempo de llegada (minutos desde la creacion).
- Al **cerrar** el ticket (con la solucion aplicada) se registra la fecha de
  cierre, el tiempo de resolucion (desde el inicio) y el tiempo total (desde
  la creacion).
- Si el area es **Asesor**, el formulario pide ademas el **team leader**
  (lista en `TEAM_LEADERS`, `src/lib/ticket.ts`). En Administrativos no se
  pide y el campo queda vacio; si el cliente manda uno igual, el servidor lo
  descarta. En el panel se puede filtrar por team leader y el desplegable
  muestra cuantos tickets lleva cada uno, para ver quien concentra mas.
- La **prioridad no la elige quien reporta**: se asigna sola segun la
  categoria (tabla `PRIORIDAD_POR_CATEGORIA` en `src/lib/ticket.ts`).
  Hardware, Software, Red / Internet y Accesos y credenciales → ALTA;
  Correo electronico → MEDIA; Impresoras y Otro → BAJA. Aplica igual para
  las dos areas. El servidor la calcula e ignora cualquier prioridad que
  venga en la peticion.
- El panel tiene dos zonas: **Activos** (pendientes + en proceso), que es la
  vista inicial, y **Finalizados**, el historial. Al cerrar un ticket
  desaparece de Activos y pasa a Finalizados.
- En Finalizados la solucion **no** se muestra de entrada: se descarga al
  pulsar "Ver solucion" y queda cacheada. Un ticket cerrado muestra solo
  **cuanto tomo resolverlo** (desde "Voy en camino" hasta el cierre); el
  tiempo de llegada y el total se siguen guardando y salen en el Excel.
- Exportacion a Excel de los tickets **finalizados** que haya en la base en
  ese momento (`/api/admin/export/excel`), con su solucion y sin filtrar por
  fecha: el flujo es exportar y luego vaciar, y a veces se vacia cada 2 o 3
  dias. Los tickets aun abiertos no se exportan.
- Limpieza progresiva: `POST /api/admin/limpieza?dias=30` borra tickets
  cerrados con mas de N dias (para no saturar el plan gratuito de la base de
  datos). Pensado para llamarse desde una tarea programada (cron) o
  manualmente.
- Seguimiento publico de un ticket por su codigo en `/seguimiento`, sin
  exponer datos del solicitante.

## Consumo del plan gratuito

El plan gratuito de Supabase da **500 MB de base** y **5 GB de egress al
mes**. Medido sobre datos reales, un ticket ocupa **~609 bytes** con
indices: caben del orden de **800.000 tickets**, asi que el disco nunca es
el limite.

El limite real es el egress, y lo marca el refresco automatico del panel.
Por eso el panel esta deliberadamente conservador:

- la vista inicial solo trae los tickets **activos**, no el historial;
- el listado **no incluye la solucion** (el campo mas pesado); se pide
  aparte al abrir un ticket finalizado, y queda cacheada;
- el refresco es cada **20 s**, no cada 5;
- **se detiene** cuando la pestana no esta visible, y recarga al volver;
- en **Finalizados no hay refresco en bucle**: es historial, no cambia solo.

Con eso, el panel abierto 8 h diarias y ~10 tickets abiertos a la vez gasta
unos **130 MB al mes (2,5 % del limite)**. Antes de estos ajustes, con 100
tickets acumulados se pasaba del limite (172 %).

Si algun dia se cambia el intervalo o se vuelve a cargar el historial en la
vista por defecto, revisar este calculo primero.

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
