# Historial de cambios

Registro de los cambios del sistema, construido a partir del historial de
versiones del repositorio (`git log`). Las fechas corresponden a los commits.

## [1.0.0] — 2026-10-01

Versión de entrega del Frente 1 del plan de trabajo de septiembre.

### Organización
- Reorganización de componentes por área (`publico/`, `panel/`, `ui/`, `layout/`).
- Documentación funcional y técnica en `docs/` y README del proyecto.

## 2026-09-30 — Puesta en producción y ajustes de marcha blanca
- La consulta pública de un ticket pendiente muestra su posición en la cola y el
  tiempo estimado, recalculados en cada consulta (antes solo se veían al radicar).
- El seed carga el `.env` y reafirma el nombre de las cuentas sembradas.

## 2026-09-29 — Perfiles, bitácora y cola de atención
- Separación de perfiles: **líder de TI** (`/admin`) y **soporte** (`/soporte`),
  con el rol firmado dentro de la sesión.
- Gestión de cuentas de soporte y restablecimiento de contraseñas desde el panel
  del líder.
- Bitácora de actividad (`RegistroActividad`): inicios de sesión, tickets tomados,
  cerrados y eliminados, cambios de prioridad y de cuentas.
- Posición en la cola y estimado de primera respuesta al radicar un ticket,
  respetando el horario laboral (lunes a viernes, 8:00 a 18:00).
- Integración de las ramas `seguridad/rls-supabase` (PR #1) y
  `feature/cola-de-atencion` (PR #2).

## 2026-09-22 — Acuerdo de nivel de servicio (SLA)
- Tabla de SLA por prioridad, cumplimiento por ticket y resumen en el panel.
- Cierre fuera de tiempo exige justificación (validada en el servidor).
- El veredicto del SLA se define solo por el tiempo de solución.
- Columnas de SLA en la exportación a Excel.

## 2026-09-21
- Se agrega a Carlos Fernando Vélez a la lista de team leaders.

## 2026-09-14 — Seguridad de la base de datos
- Row Level Security activado y privilegios públicos revocados en Supabase,
  incluidos los privilegios por defecto para tablas futuras.

## 2026-09-13
- El número de puesto se pide solo al área Asesor.
- El usuario autenticado puede cambiar su nombre visible.

## 2026-09-07 — Reglas de negocio y panel
- Número de puesto y prioridad automática según la categoría.
- Separación de tickets **Activos** y **Finalizados**; reducción del tráfico del
  panel (sin la solución en el listado, refresco cada 20 s, pausa con la pestaña
  oculta).
- Team leader en los tickets de asesores y filtro por team leader.
- Validación de campos en pantalla antes de enviar.
- El borrado masivo elimina únicamente los tickets finalizados.

## 2026-08-31 — Primera versión
- Formulario público de tickets, seguimiento por código y panel de administración.
- Conexión a PostgreSQL en Supabase.
- Login con usuario simple y opción de mostrar la contraseña.
- Identidad visual VOZ360 (isotipo, colores de marca, logo animado).
- Borrado de tickets y exportación a Excel.
