# Seguridad

## 1. Autenticación

| Control | Implementación |
|---|---|
| Contraseñas | Hash **bcrypt** (costo 10). Nunca se guardan ni se devuelven en texto plano. |
| Sesión | **JWT HS256** firmado con `AUTH_SECRET`. Una cookie por panel: `soporte_ti_sesion_admin` y `soporte_ti_sesion_soporte`, para poder tener ambos paneles abiertos a la vez en el mismo navegador sin que uno cierre el otro. |
| Cookie | `httpOnly` (inaccesible desde JavaScript), `secure` en producción, `sameSite=lax`. |
| Expiración | 8 horas. Después hay que volver a iniciar sesión. |
| Mensajes de error | Usuario inexistente y contraseña incorrecta devuelven el mismo mensaje. |
| Contraseña mínima | 8 caracteres para las cuentas de soporte, validada en el servidor. |
| Credenciales iniciales | Solo en variables de entorno. El seed se detiene si faltan; no hay contraseñas por defecto en el código. |

## 2. Autorización

Dos perfiles, con el rol **firmado dentro del JWT**: no se puede alterar desde el
navegador sin conocer `AUTH_SECRET`.

| Capacidad | Soporte | Líder de TI |
|---|:-:|:-:|
| Ver, tomar, repriorizar y cerrar tickets | ✔ | ✔ |
| Exportar finalizados a Excel | ✔ | ✔ |
| Cambiar su propio nombre | ✔ | ✔ |
| Eliminar tickets (puntual o masivo) | — | ✔ |
| Crear cuentas y restablecer contraseñas | — | ✔ |
| Consultar la bitácora | — | ✔ |
| Limpieza por antigüedad | — | ✔ |

La verificación ocurre en dos capas:

1. **`src/middleware.ts`** — exige sesión válida en `/soporte`, `/admin` y
   `/api/admin/*`, y rol `ADMIN` en `/admin`. Un soporte que entra a `/admin` es
   devuelto a `/soporte`.
2. **Cada ruta de la API** — las acciones exclusivas del administrador exigen
   que la petición venga del **panel del líder** (`x-panel: admin`) con una
   sesión de rol `ADMIN`; si no, responden 403. El panel de soporte nunca borra
   ni gestiona cuentas, aunque quien haya entrado ahí sea una cuenta de
   administrador.

Como las rutas `/api/admin/*` las usan los dos paneles, el navegador indica
desde cuál llama con la cabecera `x-panel` (o `?panel=` en la descarga del
Excel). La cabecera no otorga permisos: solo elige entre sesiones que el
navegador ya tiene, y cada una se valida igual. Si falta, se usa la sesión de
soporte (la de menos permisos), de modo que una llamada sin cabecera nunca
actúa como administrador.

No existe forma de crear un administrador desde la interfaz: solo con el seed, en
el servidor. Así nadie puede escalar privilegios desde el panel.

## 3. Protección de datos

- **Base de datos (Supabase):** Row Level Security activado en `User`, `Ticket`,
  `RegistroActividad` y `_prisma_migrations`, sin políticas (denegación por
  defecto). Se revocaron los privilegios de los roles públicos `anon` y
  `authenticated`, también los privilegios por defecto para tablas futuras. La
  aplicación no se ve afectada porque Prisma usa el rol propietario.
  *Antes de esta medida, cualquiera con la clave pública del proyecto podía leer
  los hashes de contraseña o borrar tickets a través de la API de Supabase.*
- **Consulta pública:** devuelve solo datos no personales del ticket y nunca el
  `id` interno.
- **Validación:** toda entrada pasa por esquemas Zod en el servidor, aunque el
  formulario ya la haya validado.
- **Prioridad:** el servidor ignora cualquier prioridad enviada por el cliente,
  así nadie puede marcar su caso como urgente para saltarse la fila.

## 4. Trazabilidad

La bitácora (`RegistroActividad`) registra inicios de sesión, tickets tomados,
cerrados y eliminados, borrados masivos, cambios de prioridad, cuentas creadas,
contraseñas restablecidas y cambios de nombre. Conserva el nombre de quien actuó
y el código del ticket aunque la cuenta o el ticket se eliminen después.

## 5. Gestión de secretos

| Secreto | Dónde vive |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | `.env` local y variables de entorno de Vercel |
| `AUTH_SECRET` | Ídem. Debe ser largo, aleatorio y distinto por entorno. |
| Contraseñas iniciales | Solo en `.env`, para ejecutar el seed |

El archivo `.env` está en `.gitignore` y nunca se sube al repositorio.

## 6. Riesgos conocidos y recomendaciones

| Riesgo | Estado / recomendación |
|---|---|
| Avisos de `npm audit` en Next.js 14 | Next.js 14.2.35 es el último parche de la rama 14. Los avisos restantes se resuelven migrando a Next 15+, que cambia las APIs de `cookies()` y `searchParams`. Planificar la migración. |
| Sin límite de intentos de login | Recomendado: agregar *rate limiting* en `/api/auth/login`. |
| Formulario público sin captcha | Cualquiera con el enlace puede radicar tickets. Aceptable en la red interna; evaluar captcha si se abusa. |
| Código consultable por enumeración | Los códigos son correlativos; la consulta no expone datos personales, lo que limita el impacto. |
| Rotación de `AUTH_SECRET` | Cambiarlo cierra todas las sesiones activas; hacerlo si se sospecha filtración. |
