# Modelo de datos

Motor: **PostgreSQL** en Supabase, administrado con **Prisma**. El esquema está en
`prisma/schema.prisma` y su historia en `prisma/migrations/`.

## 1. Diagrama

```
┌──────────────────────────┐          ┌──────────────────────────────┐
│ User                     │ 1      * │ Ticket                       │
│──────────────────────────│──────────│──────────────────────────────│
│ id            PK (cuid)  │  atiende │ id               PK (cuid)   │
│ nombre                   │          │ codigoTicket     UNIQUE      │
│ correo        UNIQUE     │          │ nombreSolicitante            │
│ area          (opcional) │          │ numeroPuesto                 │
│ rol           ADMIN|SOPORTE         │ area / teamLeader            │
│ passwordHash  (bcrypt)   │          │ categoria / descripcion      │
│ creadoEn                 │          │ estado / prioridad           │
└────────────┬─────────────┘          │ fechaCreacion/Inicio/Cierre  │
             │ 1                      │ tiempoLlegada/Resolucion/Total│
             │                        │ solucion / justificacionSla  │
             │ *                      │ adminId  FK → User (opcional)│
┌────────────┴─────────────┐          │ creadoEn / actualizadoEn     │
│ RegistroActividad        │          └──────────────────────────────┘
│──────────────────────────│
│ id            PK (cuid)  │
│ fecha                    │
│ usuarioId  FK → User (SET NULL al borrar la cuenta)
│ usuarioNombre (copia)    │
│ accion / detalle         │
│ ticketCodigo  (texto)    │
└──────────────────────────┘
```

## 2. Tablas

### `Ticket`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (cuid) | Clave primaria interna. No se expone en la consulta pública. |
| `codigoTicket` | String, único | Código visible `TCK-000123`. Si el correlativo choca tras un borrado, se agrega un sufijo. |
| `nombreSolicitante` | String | 3 a 120 caracteres. |
| `numeroPuesto` | String | Solo dígitos; texto para conservar ceros a la izquierda. `""` en Administrativos. |
| `area` | String | `Asesor` o `Administrativos`. |
| `teamLeader` | String | Uno de `TEAM_LEADERS` si el área es Asesor; `""` en otro caso. |
| `categoria` | String | Uno de `CATEGORIAS`. |
| `descripcion` | String | 10 a 2000 caracteres. |
| `estado` | String | `PENDIENTE` → `EN_PROCESO` → `CERRADO`. |
| `prioridad` | String | `BAJA`, `MEDIA`, `ALTA` o `CRITICA`. |
| `fechaCreacion` | DateTime | Momento de radicación. |
| `fechaInicio` | DateTime? | "Voy en camino". |
| `fechaCierre` | DateTime? | Cierre. |
| `tiempoLlegada` | Int? (min) | Creación → inicio. |
| `tiempoResolucion` | Int? (min) | Inicio → cierre. |
| `tiempoTotal` | Int? (min) | Creación → cierre. |
| `solucion` | String? | Obligatoria al cerrar (5 a 2000 caracteres). |
| `justificacionSla` | String | Obligatoria solo si el cierre queda fuera del SLA; `""` si cumplió. |
| `adminId` | String? → `User.id` | Quien tomó el ticket ("Atendido por"). |
| `creadoEn` / `actualizadoEn` | DateTime | Auditoría técnica. |

**Índices:** `estado`, `fechaCreacion`, `fechaCierre`, `teamLeader`.

### `User`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (cuid) | Clave primaria. |
| `nombre` | String | Nombre visible; editable por el propio usuario. |
| `correo` | String, único | Identificador de inicio de sesión. Para el administrador puede ser un usuario simple (ej. `admin`). |
| `area` | String? | Opcional. |
| `rol` | String | `ADMIN` (líder de TI) o `SOPORTE`. Por defecto `SOPORTE`. |
| `passwordHash` | String | Hash bcrypt (costo 10). Nunca se devuelve en la API. |
| `creadoEn` | DateTime | |

### `RegistroActividad`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (cuid) | Clave primaria. |
| `fecha` | DateTime | Momento de la acción. |
| `usuarioId` | String? → `User.id` | Se pone en `NULL` si la cuenta se elimina. |
| `usuarioNombre` | String | Copia del nombre: el registro sigue siendo legible sin la cuenta. |
| `accion` | String | Ver tabla de acciones. |
| `detalle` | String | Descripción legible. |
| `ticketCodigo` | String? | Texto, no relación: sobrevive al borrado del ticket. |

**Índices:** `fecha`, `usuarioId`.

**Acciones registradas** (`src/lib/registro.ts`): `INICIO_SESION`,
`TICKET_INICIADO`, `TICKET_CERRADO`, `TICKET_ELIMINADO`, `TICKETS_ELIMINADOS`,
`PRIORIDAD_CAMBIADA`, `USUARIO_CREADO`, `PASSWORD_RESTABLECIDA`, `NOMBRE_CAMBIADO`.

## 3. Migraciones

| Migración | Cambio |
|---|---|
| `20260901011418_init` | Tablas `User` y `Ticket`. |
| `20260901015014_quitar_correo_ticket` | Se retira el correo del solicitante (el formulario no lo pide). |
| `20260907000000_agregar_numero_puesto` | Campo `numeroPuesto`. |
| `20260908000000_agregar_team_leader` | Campo `teamLeader` e índice. |
| `20260914000000_habilitar_rls` | Row Level Security y revocación de privilegios públicos de Supabase. |
| `20260922000000_agregar_justificacion_sla` | Campo `justificacionSla`. |
| `20260929120000_roles_y_registro_actividad` | `rol` de `User` pasa a `SOPORTE` por defecto; tabla `RegistroActividad` con RLS. |

Para aplicar las migraciones en un entorno: `npx prisma migrate deploy`.
Para crear una nueva durante el desarrollo: `npx prisma migrate dev --name <nombre>`.

## 4. Capacidad

Medido sobre datos reales, un ticket ocupa ~609 bytes con índices. El plan
gratuito de Supabase (500 MB) admite del orden de 800.000 tickets: el límite
práctico no es el disco sino el tráfico (egress), y por eso el panel está
optimizado (ver [Arquitectura](../02-arquitectura/arquitectura.md#5-decisiones-de-diseño)).
