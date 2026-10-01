# sistema-soporte-ti

Código fuente de la aplicación web del **Sistema de Gestión de Soporte TI**
(Next.js 14 + Prisma + PostgreSQL en Supabase).

La descripción del proyecto está en el [README principal](../README.md) y la
documentación completa en [`../docs/`](../docs/README.md).

> No renombrar esta carpeta: Vercel la usa como *Root Directory* del despliegue.

## Inicio rápido

Requisitos: Node.js 18+ y un proyecto de Supabase.

```bash
npm install
cp .env.example .env        # completar DATABASE_URL, DIRECT_URL, AUTH_SECRET y cuentas
npx prisma migrate deploy
npm run seed
npm run dev                 # http://localhost:3000
```

| URL | Pantalla |
|---|---|
| `/` | Formulario público de tickets |
| `/seguimiento` | Consulta por código |
| `/soporte/login` | Panel de soporte |
| `/admin/login` | Panel del líder de TI |

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Desarrollo con recarga automática |
| `npm run build` | Compilación de producción y verificación de tipos |
| `npm start` | Sirve la compilación |
| `npm run seed` | Crea/actualiza las cuentas definidas en `.env` |
| `npm run prisma:migrate` | Nueva migración (desarrollo) |
| `npm run prisma:migrate:deploy` | Aplica migraciones pendientes |
| `npm run prisma:studio` | Explorador visual de la base |

## Estructura

```
prisma/
  schema.prisma        Modelo de datos (Ticket, User, RegistroActividad)
  migrations/          Migraciones SQL versionadas
  seed.ts              Siembra las cuentas de líder de TI y soporte
src/
  middleware.ts        Control de acceso a /admin, /soporte y /api/admin
  app/                 Páginas y API REST (App Router)
  components/
    publico/           Formulario, seguimiento y panel de la cola
    panel/             Tablero de tickets, cuentas, bitácora, SLA, login
    ui/                Insignias de estado, prioridad y SLA; íconos
    layout/            Encabezado, pie y logotipos
  lib/
    ticket.ts          Catálogos, prioridad, SLA y cola (puro, apto para el navegador)
    horario.ts         Jornada laboral (puro)
    validation.ts      Esquemas Zod compartidos cliente/servidor
    auth.ts            Contraseñas, JWT y roles (servidor)
    cola.ts            Posición en la cola (servidor)
    codigoTicket.ts    Código TCK-xxxxxx (servidor)
    registro.ts        Bitácora de actividad (servidor)
    db.ts              Cliente de Prisma (servidor)
```

Los módulos marcados como *servidor* consultan la base de datos y no deben
importarse desde componentes `"use client"` (salvo sus tipos, con `import type`).

## Documentación

| Tema | Documento |
|---|---|
| Reglas de negocio y SLA | [01 · Requerimientos](../docs/01-requerimientos/requerimientos-funcionales.md) |
| Arquitectura y decisiones | [02 · Arquitectura](../docs/02-arquitectura/arquitectura.md) |
| Tablas y migraciones | [03 · Modelo de datos](../docs/03-base-de-datos/modelo-de-datos.md) |
| Endpoints | [04 · API](../docs/04-api/referencia-api.md) |
| Seguridad | [05 · Seguridad](../docs/05-seguridad/seguridad.md) |
| Variables de entorno y Vercel | [06 · Despliegue](../docs/06-despliegue/despliegue-y-operacion.md) |
