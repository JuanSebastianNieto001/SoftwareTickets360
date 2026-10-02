# Referencia de la API

API REST implementada con *Route Handlers* de Next.js en `src/app/api/`. Todas las
peticiones y respuestas usan JSON, salvo la exportación a Excel.

**URL base en producción:** `https://software-ticketsv0z360.vercel.app`

## Autenticación y permisos

- Las rutas `/api/admin/*` exigen una cookie de sesión, que se obtiene con
  `POST /api/auth/login`. Cada panel tiene la suya (`soporte_ti_sesion_admin`,
  `soporte_ti_sesion_soporte`). Sin cookie válida responden **401**.
- Cabecera `x-panel: admin | soporte`: indica con qué sesión actuar cuando el
  navegador tiene las dos. Sin ella se usa la de soporte. La descarga del Excel
  acepta `?panel=` en su lugar.
- Algunas rutas son exclusivas del **líder de TI**: exigen `x-panel: admin` y la
  sesión del panel del líder con rol `ADMIN` (leído del JWT firmado). Desde el
  panel de soporte responden **403**, sea cual sea la cuenta.
- Los errores tienen la forma `{ "error": "mensaje legible" }`.

| Código | Significado |
|---|---|
| 400 | Cuerpo o parámetros inválidos (el mensaje indica el campo). |
| 401 | Sin sesión, o credenciales incorrectas en el login. |
| 403 | Sesión válida, pero el rol no tiene permiso. |
| 404 | El recurso no existe. |
| 409 | El estado del ticket no permite la acción (ya iniciado o ya cerrado). |

## Resumen

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/tickets` | Público | Radicar un ticket |
| GET | `/api/tickets/consulta` | Público | Consultar un ticket por código |
| POST | `/api/auth/login` | Público | Iniciar sesión |
| POST | `/api/auth/logout` | Público | Cerrar sesión |
| GET | `/api/admin/tickets` | Sesión | Listado del panel |
| DELETE | `/api/admin/tickets` | **ADMIN** | Borrar todos los finalizados |
| GET | `/api/admin/tickets/:id` | Sesión | Detalle (incluye solución) |
| DELETE | `/api/admin/tickets/:id` | **ADMIN** | Borrar un ticket |
| POST | `/api/admin/tickets/:id/iniciar` | Sesión | "Voy en camino" |
| POST | `/api/admin/tickets/:id/cerrar` | Sesión | Cerrar con solución |
| PATCH | `/api/admin/tickets/:id/prioridad` | Sesión | Cambiar prioridad |
| GET | `/api/admin/export/excel` | Sesión | Excel de finalizados |
| PATCH | `/api/admin/perfil` | Sesión | Cambiar el nombre propio |
| GET | `/api/admin/usuarios` | **ADMIN** | Listar cuentas |
| POST | `/api/admin/usuarios` | **ADMIN** | Crear cuenta de soporte |
| POST | `/api/admin/usuarios/:id/password` | **ADMIN** | Restablecer contraseña |
| GET | `/api/admin/registro` | **ADMIN** | Bitácora de actividad |
| POST | `/api/admin/limpieza` | **ADMIN** | Borrar cerrados antiguos |

## Rutas públicas

### `POST /api/tickets` — Radicar un ticket

```json
{
  "nombreSolicitante": "Ana Gómez",
  "area": "Asesor",
  "teamLeader": "Marko Velez",
  "numeroPuesto": "12",
  "categoria": "Software",
  "descripcion": "No abre el aplicativo de ventas desde esta mañana"
}
```

- `teamLeader` y `numeroPuesto` solo se exigen si `area` es `Asesor`; en
  `Administrativos` se descartan.
- Si se envía `prioridad`, se ignora: la calcula el servidor según la categoría.

**201**

```json
{
  "codigoTicket": "TCK-000078",
  "prioridad": "ALTA",
  "cola": {
    "posicion": 3,
    "enCola": 3,
    "enAtencion": 1,
    "estimadoMinutos": 45,
    "estimadoTexto": "45 min",
    "dentroDeHorario": true
  },
  "mensaje": "Ticket creado correctamente. Guarda tu codigo para hacerle seguimiento."
}
```

| Campo de `cola` | Significado |
|---|---|
| `posicion` | Puesto entre los pendientes (1 = el siguiente). |
| `enCola` | Total de pendientes, incluido este. |
| `enAtencion` | Tickets en proceso (ocupan al técnico). |
| `estimadoMinutos` | Minutos de jornada estimados hasta la primera respuesta. |
| `estimadoTexto` | Lo mismo, para mostrar: `"35 min"` o `"lunes 5 de octubre a las 8:30"`. |
| `dentroDeHorario` | `false` si el momento del cálculo está fuera de la jornada. |

### `GET /api/tickets/consulta?codigo=TCK-000078` — Consultar

**200**

```json
{
  "ticket": {
    "codigoTicket": "TCK-000078",
    "estado": "PENDIENTE",
    "categoria": "Software",
    "area": "Asesor",
    "prioridad": "ALTA",
    "fechaCreacion": "2026-09-30T19:30:06.089Z",
    "fechaInicio": null,
    "fechaCierre": null,
    "tiempoLlegada": null,
    "tiempoResolucion": null,
    "tiempoTotal": null,
    "solucion": null
  },
  "cola": { "posicion": 2, "enCola": 2, "enAtencion": 1, "estimadoMinutos": 25, "estimadoTexto": "25 min", "dentroDeHorario": true }
}
```

- `cola` es `null` si el ticket no está pendiente.
- No devuelve nombre, puesto, team leader ni descripción.
- **404** si el código no existe.

### `POST /api/auth/login`

```json
{ "correo": "admin", "password": "••••••••", "panel": "admin" }
```

**200** con `{ ok, nombre, rol, panel }` y la cookie del panel (httpOnly, 8 h).
`panel` es el login por el que se entró (por defecto `soporte`); una cuenta de
soporte que entra por el panel del líder queda en el de soporte. Usuario inexistente y
contraseña incorrecta devuelven el **mismo** 401, para no revelar qué cuentas
existen. Cada inicio de sesión se registra en la bitácora.

### `POST /api/auth/logout`

Borra solo la cookie del panel indicado en `x-panel`; la del otro panel sigue
activa. Sin cabecera, borra las dos.

## Rutas privadas — tickets

### `GET /api/admin/tickets`

| Parámetro | Valores |
|---|---|
| `estado` | `ACTIVOS` (pendientes + en proceso), `PENDIENTE`, `EN_PROCESO`, `CERRADO`. Sin valor: todos. |
| `q` | Texto a buscar en código, nombre, puesto o área. |
| `teamLeader` | Nombre exacto de un team leader. |

**200** — `{ tickets: [...], contadores: { PENDIENTE, EN_PROCESO, CERRADO }, porTeamLeader: { "<nombre>": n } }`

- Orden: pendientes por prioridad y antigüedad (igual que la cola), luego en
  proceso, luego cerrados por cierre más reciente.
- El listado **no** incluye `solucion` ni `justificacionSla` (se piden en el
  detalle).
- `contadores` y `porTeamLeader` se calculan sobre toda la tabla, no sobre el
  filtro.

### `DELETE /api/admin/tickets?confirmacion=ELIMINAR` — ADMIN

Borra **solo los tickets finalizados**. Exige el parámetro de confirmación exacto.

Cuerpo opcional para conservar algunos:

```json
{ "conservar": ["id-del-ticket-1", "id-del-ticket-2"] }
```

Los finalizados de la lista no se borran (máximo 1000 ids). Sin cuerpo se borran
todos. Responde `{ eliminados, mensaje }`.

### `GET /api/admin/tickets/:id`

Detalle completo del ticket, incluida la solución y la justificación del SLA.

### `DELETE /api/admin/tickets/:id` — ADMIN

Borra un ticket puntual, en cualquier estado.

### `POST /api/admin/tickets/:id/iniciar`

Pasa el ticket de `PENDIENTE` a `EN_PROCESO`, lo asigna al usuario de la sesión
y registra `fechaInicio` y `tiempoLlegada`. **409** si ya fue iniciado o cerrado.

### `POST /api/admin/tickets/:id/cerrar`

```json
{ "solucion": "Se reinstaló el aplicativo y se limpió la caché", "justificacionSla": "" }
```

Registra `fechaCierre`, `tiempoResolucion` y `tiempoTotal`. Si el tiempo de
solución supera la meta de la prioridad, `justificacionSla` es obligatoria
(mínimo 10 caracteres) y sin ella responde **400**. **409** si ya estaba cerrado.

### `PATCH /api/admin/tickets/:id/prioridad`

```json
{ "prioridad": "CRITICA" }
```

Solo para tickets abiertos. Es la única forma de asignar `CRITICA`.

### `GET /api/admin/export/excel`

Descarga un `.xlsx` con los tickets **finalizados** que haya en la base, sin
filtro de fecha. Columnas: código, solicitante, puesto, área, team leader,
categoría, prioridad, descripción, solución, atendido por, fechas de creación,
inicio y cierre, tiempos de llegada, resolución y total, meta de solución,
cumplimiento del SLA, tiempo excedido, meta y resultado de primera respuesta,
y motivo del incumplimiento.

## Rutas privadas — cuentas y administración

### `PATCH /api/admin/perfil`

`{ "nombre": "Nombre Apellido" }` — cambia el nombre del usuario de la sesión
(nunca de otro). Se refleja como "Atendido por" en sus tickets, también en los
ya cerrados.

### `GET /api/admin/usuarios` — ADMIN

Listado de cuentas con su actividad. Nunca incluye el hash de la contraseña.

### `POST /api/admin/usuarios` — ADMIN

`{ "nombre": "...", "correo": "nombre@voz360.co", "password": "mínimo 8 caracteres" }`
— crea siempre una cuenta con rol `SOPORTE`. Los administradores solo se crean
con el seed.

### `POST /api/admin/usuarios/:id/password` — ADMIN

`{ "password": "mínimo 8 caracteres" }` — no pide la contraseña actual.

### `GET /api/admin/registro?limite=100&usuarioId=...` — ADMIN

Bitácora de actividad, más reciente primero. `limite` tiene un tope máximo en
el servidor; `usuarioId` filtra por persona.

### `POST /api/admin/limpieza?dias=30` — ADMIN

Borra los tickets cerrados hace más de `dias` días (mínimo 7). No tiene botón en
la interfaz: está pensado para ejecutarse a mano o desde una tarea programada,
enviando la cookie del panel del líder y la cabecera `x-panel: admin`.
