# Despliegue y operación

Plan de acción relacionado: **PDA 2 — Puesta en producción del software de
gestión de tickets.**

## 1. Entornos

| Entorno | URL | Base de datos | Despliegue |
|---|---|---|---|
| Producción | https://software-ticketsv0z360.vercel.app | Supabase (PostgreSQL) | Automático en cada push a `main` |
| Desarrollo | http://localhost:3000 | Supabase o SQLite local | `npm run dev` |

## 2. Requisitos

- Node.js 18 o superior.
- Un proyecto de Supabase (plan gratuito).
- Cuenta de Vercel conectada al repositorio de GitHub (solo para producción).

## 3. Variables de entorno

Se copian de `sistema-soporte-ti/.env.example` a `.env`.

| Variable | Obligatoria | Descripción |
|---|:-:|---|
| `DATABASE_URL` | ✔ | Cadena de conexión agrupada de Supabase (*Transaction pooler*, puerto 6543). La usa la app. |
| `DIRECT_URL` | ✔ | Conexión directa (puerto 5432). La usa Prisma solo para migraciones. |
| `AUTH_SECRET` | ✔ | Cadena larga y aleatoria para firmar las sesiones. Distinta por entorno. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NOMBRE` | Para el seed | Cuenta del líder de TI (rol ADMIN). |
| `SOPORTE_EMAIL` / `SOPORTE_PASSWORD` / `SOPORTE_NOMBRE` | Opcional | Cuenta de soporte. Sin contraseña, el seed no la crea. |

Las cadenas de conexión están en Supabase: **Project Settings → Database →
Connection string**.

## 4. Instalación local

```bash
cd sistema-soporte-ti
npm install                 # también ejecuta prisma generate
cp .env.example .env        # completar los valores
npx prisma migrate deploy   # crea o actualiza las tablas
npm run seed                # crea o actualiza las cuentas
npm run dev
```

| URL | Pantalla |
|---|---|
| `/` | Formulario público |
| `/seguimiento` | Consulta por código |
| `/soporte/login` | Panel de soporte |
| `/admin/login` | Panel del líder de TI |

### Scripts disponibles

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática. |
| `npm run build` | Compilación de producción (verifica tipos). |
| `npm start` | Sirve la compilación de producción. |
| `npm run seed` | Crea o actualiza las cuentas de `.env`. Es idempotente. |
| `npm run prisma:migrate` | Crea una migración nueva (desarrollo). |
| `npm run prisma:migrate:deploy` | Aplica migraciones pendientes. |
| `npm run prisma:studio` | Explorador visual de la base de datos. |

## 5. Despliegue en producción (Vercel)

### Configuración inicial (una sola vez)

1. En Vercel, importar el repositorio `SoftwareTickets360` con
   **Root Directory = `sistema-soporte-ti`**.
2. Registrar las variables `DATABASE_URL`, `DIRECT_URL` y `AUTH_SECRET` con los
   valores de producción.
3. Desplegar. Vercel detecta Next.js y ejecuta `prisma generate` en cada build.
4. Desde un equipo con el `.env` de producción, ejecutar una vez:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

### Despliegues siguientes

Cada push a la rama `main` publica una versión nueva automáticamente. Si el
cambio incluye una migración, aplicarla con `npx prisma migrate deploy`
**antes** del push: las migraciones no corren en el build, a propósito.

> La carpeta `sistema-soporte-ti/` no debe renombrarse sin actualizar también el
> *Root Directory* en Vercel; si no, el despliegue falla.

### Verificación posterior

1. Abrir `/`, radicar un ticket de prueba y anotar el código.
2. Consultarlo en `/seguimiento`: debe mostrar posición en la cola.
3. Entrar a `/soporte/login`, tomarlo con "Voy en camino" y cerrarlo.
4. Desde `/admin`, eliminar el ticket de prueba y revisar que la bitácora
   registró cada paso.

## 6. Operación

### Rutina diaria
- Mantener el panel abierto durante la jornada (se actualiza cada 20 s).
- Atender los pendientes en el orden en que aparecen: es el mismo orden que se
  le prometió a cada usuario.

### Rutina periódica (cada 2 a 3 días, o semanal)
1. **Exportar finalizados** a Excel y guardar el archivo en la carpeta del área.
2. **Borrar finalizados** desde el panel del líder (escribiendo `ELIMINAR`).

El orden importa: los finalizados borrados no se recuperan.

### Copias de seguridad
- El Excel exportado es el respaldo funcional del historial.
- Supabase conserva respaldos diarios automáticos según su plan; para un
  respaldo completo manual: `pg_dump "$DIRECT_URL" > respaldo.sql`.

### Gestión de cuentas
- Altas y cambios de contraseña de soporte: desde el panel del líder.
- Cambiar la contraseña del líder: actualizar `ADMIN_PASSWORD` en `.env` y
  ejecutar `npm run seed`.

### Consumo del plan gratuito
El panel abierto 8 h diarias con ~10 tickets activos consume ~130 MB de tráfico
al mes (≈2,5 % de los 5 GB de Supabase). Si se cambia el intervalo de refresco
o se carga el historial en la vista inicial, revisar este cálculo.

## 7. Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| "Falta AUTH_SECRET" en los logs | Variable no definida en Vercel | Registrarla y volver a desplegar. |
| El login siempre falla | La cuenta no existe en esa base | Ejecutar `npm run seed` con el `.env` de ese entorno. |
| Error de columna inexistente | Migración sin aplicar | `npx prisma migrate deploy`. |
| El cambio no se ve en producción | No se hizo push a `main`, o el build falló | Revisar el despliegue en el panel de Vercel. |
| Todas las sesiones se cerraron | Se cambió `AUTH_SECRET` | Es lo esperado; volver a iniciar sesión. |
