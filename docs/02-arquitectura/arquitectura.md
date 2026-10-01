# Arquitectura

## 1. Vista general

```
                  ┌──────────────────────────── Vercel ────────────────────────────┐
 Navegador        │  Next.js 14 (App Router)                                      │
 ─────────        │                                                               │
 Colaborador ───▶ │  /  /seguimiento         Páginas públicas (React)             │
                  │                                                               │
 Soporte ───────▶ │  /soporte  /admin        Paneles privados (React)             │
 Líder de TI      │        ▲                                                      │
                  │        │ middleware.ts   Verifica la cookie de sesión (JWT)   │
                  │        ▼                 y el rol antes de cada ruta privada  │
                  │  /api/tickets/*          API pública                          │
                  │  /api/auth/*             Login / logout                       │
                  │  /api/admin/*            API privada (sesión + rol)           │
                  │        │                                                      │
                  │        │ src/lib/*       Reglas de negocio, auth, validación  │
                  │        ▼                                                      │
                  │  Prisma Client                                                │
                  └────────┼──────────────────────────────────────────────────────┘
                           │ PostgreSQL (pooler, puerto 6543)
                           ▼
                  ┌──────────────── Supabase ────────────────┐
                  │  PostgreSQL · RLS activo · sin Data API  │
                  │  Tablas: Ticket, User, RegistroActividad │
                  └──────────────────────────────────────────┘
```

La aplicación es un **monolito Next.js**: las páginas y la API viven en el mismo
proyecto y se despliegan juntas en Vercel como funciones serverless. La base de
datos es PostgreSQL administrado por Supabase, al que la aplicación accede solo a
través de Prisma. No se usa el cliente ni la autenticación de Supabase.

## 2. Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | Next.js 14 (App Router) | Páginas y API en un solo proyecto; despliegue directo en Vercel. |
| Lenguaje | TypeScript | Los catálogos (áreas, categorías, prioridades) generan tipos: agregar un valor obliga a cubrirlo en todo el código. |
| Estilos | Tailwind CSS | Identidad visual VOZ360 con clases utilitarias, sin hojas de estilo por componente. |
| Acceso a datos | Prisma ORM 5 | Esquema versionado, migraciones y consultas tipadas. |
| Base de datos | PostgreSQL en Supabase | Plan gratuito suficiente (≈800.000 tickets de capacidad). |
| Validación | Zod | El mismo esquema valida el formulario en el navegador y la petición en el servidor. |
| Autenticación | JWT (`jose`) + `bcryptjs` | Sesión propia, sencilla, con dos roles. Ver [Seguridad](../05-seguridad/seguridad.md). |
| Reportes | `exceljs` | Exportación de finalizados a `.xlsx`. |
| Hosting | Vercel | Despliegue automático en cada push a `main`. |

## 3. Organización del código

```
sistema-soporte-ti/
├── prisma/
│   ├── schema.prisma          Modelo de datos
│   ├── migrations/            Migraciones SQL versionadas (7)
│   └── seed.ts                Siembra las cuentas de líder de TI y soporte
├── public/                    Logo VOZ360
└── src/
    ├── middleware.ts          Guardia de /admin, /soporte y /api/admin
    ├── app/                   Rutas (cada carpeta es una URL)
    │   ├── page.tsx           /             Formulario público
    │   ├── seguimiento/       /seguimiento  Consulta por código
    │   ├── soporte/           /soporte      Panel de soporte (+ /login)
    │   ├── admin/             /admin        Panel del líder de TI (+ /login)
    │   └── api/               API REST (ver 04-api)
    ├── components/
    │   ├── publico/           TicketForm, SeguimientoBuscador, EstadoColaPanel
    │   ├── panel/             AdminDashboard, PanelUsuarios, RegistroActividad,
    │   │                      TablaSla, LoginForm, NombreAdmin, BotonCerrarSesion
    │   ├── ui/                EstadoBadge, PrioridadBadge, SlaBadge, icons
    │   └── layout/            SiteHeader, SiteFooter, VozLogo, HeroLogo
    └── lib/
        ├── ticket.ts          Catálogos, prioridad por categoría, SLA, cola (puro)
        ├── horario.ts         Jornada laboral y minutos hábiles (puro)
        ├── validation.ts      Esquemas Zod compartidos cliente/servidor
        ├── auth.ts            Hash de contraseñas, JWT, cookie de sesión, roles
        ├── cola.ts            Posición en la cola y estimado (consulta la base)
        ├── codigoTicket.ts    Generación del código TCK-xxxxxx (consulta la base)
        ├── registro.ts        Bitácora de actividad (consulta la base)
        └── db.ts              Instancia única de Prisma Client
```

### Regla de dependencias de `src/lib`

Los módulos se dividen en dos grupos, y la separación es intencional:

- **Puros** (`ticket.ts`, `horario.ts`, `validation.ts`): no importan la base de
  datos. Los usan tanto el servidor como los componentes del navegador.
- **De servidor** (`cola.ts`, `codigoTicket.ts`, `registro.ts`, `auth.ts`,
  `db.ts`): consultan la base o usan APIs de Node. **Nunca** deben importarse
  desde un componente con `"use client"`, porque arrastrarían Prisma al
  navegador. Los componentes de cliente pueden usar sus **tipos** con
  `import type`, que se borra al compilar.

### Fuentes únicas de verdad

| Dato | Dónde vive | Quién lo usa |
|---|---|---|
| Áreas, categorías, prioridades, team leaders | `src/lib/ticket.ts` | Formulario, validación, panel, Excel |
| Prioridad por categoría | `PRIORIDAD_POR_CATEGORIA` en `ticket.ts` | Servidor al crear; formulario como anticipo |
| Tabla de SLA | `SLA_POR_PRIORIDAD` en `ticket.ts` | Panel, validación del cierre, Excel, cola |
| Orden de atención | `ORDEN_PRIORIDAD` en `ticket.ts` | Cálculo de la cola y listado del panel |
| Horario laboral | `src/lib/horario.ts` | Estimado de la cola |

El orden de la cola y el del listado de pendientes **deben coincidir**: si se
separan, la posición que se le mostró al usuario deja de ser cierta.

## 4. Flujos principales

### Radicar un ticket
1. `TicketForm` valida con `crearTicketSchema` y envía `POST /api/tickets`.
2. El servidor vuelve a validar, calcula la prioridad con la categoría, genera el
   código y guarda el ticket como `PENDIENTE`.
3. Después de guardarlo, `calcularEstadoCola` cuenta lo que hay delante y
   proyecta el estimado sobre el horario laboral.
4. La respuesta trae el código, la prioridad y la cola; `EstadoColaPanel` los
   muestra.

### Consultar un ticket
1. `SeguimientoBuscador` llama `GET /api/tickets/consulta?codigo=...`.
2. El servidor devuelve solo campos no personales y, si está pendiente, la cola
   recalculada desde el momento de la consulta.

### Atender y cerrar
1. El panel consulta `GET /api/admin/tickets?estado=ACTIVOS` cada 20 s.
2. "Voy en camino" → `POST /api/admin/tickets/:id/iniciar` (asigna y mide la
   llegada).
3. "Cerrar ticket" → `POST /api/admin/tickets/:id/cerrar`. El servidor calcula
   los tiempos, evalúa el SLA y rechaza el cierre fuera de tiempo sin
   justificación.
4. Cada paso escribe en la bitácora.

## 5. Decisiones de diseño

| Decisión | Motivo |
|---|---|
| Estados y prioridades como texto, no como enum de PostgreSQL | Permite correr el proyecto sobre SQLite en desarrollo. Los valores se validan en la aplicación. |
| Sesión propia en vez de Supabase Auth o NextAuth | Solo hay dos roles internos; una cookie firmada es suficiente y no añade dependencias. |
| El veredicto del SLA no se guarda | Se recalcula; cambiar la tabla no deja históricos inconsistentes. |
| El listado del panel no trae la solución | Es el campo más pesado; se pide al abrir el ticket. Mantiene el egress en ~2,5 % del plan gratuito. |
| El refresco del panel se pausa con la pestaña oculta | Mismo motivo: consumo del plan gratuito. |
| Las migraciones no corren en el build de Vercel | Evita aplicarlas por accidente en cada despliegue; se ejecutan a mano con `prisma migrate deploy`. |
| La bitácora guarda el nombre y el código como texto | El registro debe sobrevivir al borrado de la cuenta o del ticket. |
