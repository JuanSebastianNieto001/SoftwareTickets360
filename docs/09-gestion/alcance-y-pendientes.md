# Alcance entregado y pendientes

Comparación entre lo planteado en el **Plan de Trabajo de septiembre 2026 —
Frente 1 (Software de gestión de tickets)** y lo que el sistema implementa a la
fecha de este documento (1 de octubre de 2026).

Convenciones: **✔ Entregado** · **◐ Parcial** · **✘ Pendiente** ·
**Org.** = actividad organizacional que el software no puede evidenciar por sí
mismo (requiere actas, listas de asistencia u otros soportes).

## PDA 1 — Desarrollo del software

| Módulo / entregable | Estado | Evidencia en el sistema |
|---|:-:|---|
| Levantamiento de requerimientos | ✔ | [Requerimientos funcionales](../01-requerimientos/requerimientos-funcionales.md) |
| Diseño de base de datos | ✔ | [Modelo de datos](../03-base-de-datos/modelo-de-datos.md), 7 migraciones versionadas |
| Diseño de interfaz | ✔ | Identidad VOZ360, formulario, seguimiento y paneles adaptables a celular |
| **Registro** | ✔ | Formulario público con validación, prioridad automática y código único |
| **Asignación** | ✔ | "Voy en camino" asigna el ticket a quien lo toma ("Atendido por") |
| **Seguimiento** | ✔ | Consulta pública por código con estado, línea de tiempo, posición en la cola y estimado |
| **Cierre** | ✔ | Cierre con solución, tiempos calculados y justificación si se incumple el SLA |
| **Notificaciones** | ✘ | No hay envío de correos. Hoy el usuario se informa con la consulta por código y el panel se refresca cada 20 s |
| **Reportes** | ◐ | Excel de finalizados con tiempos y SLA; resumen de cumplimiento en el panel. Falta un tablero de indicadores (volumen por categoría, promedios por periodo) |
| Validación en ambiente de pruebas | ◐ | Compilación de producción sin errores; casos de prueba documentados en [08-pruebas](../08-pruebas/casos-de-prueba.md), pendientes de registrar su ejecución |

**Funcionalidades adicionales no previstas en el plan:** acuerdo de nivel de
servicio con medición por ticket, cola de atención con estimado según horario
laboral, perfiles separados de soporte y líder de TI, bitácora de actividad,
seguridad a nivel de base de datos (RLS).

## PDA 2 — Puesta en producción

| Actividad | Estado | Evidencia / observación |
|---|:-:|---|
| Despliegue en producción | ✔ | https://software-ticketsv0z360.vercel.app. **Desviación:** se desplegó en la nube (Vercel + Supabase, planes gratuitos) en lugar de un servidor local; elimina el mantenimiento de servidor y permite acceso desde cualquier sede |
| Copia de seguridad | ◐ | Respaldos automáticos de Supabase y exportación periódica a Excel. No hay respaldo programado propio |
| Usuarios y perfiles | ✔ | Perfiles líder de TI y soporte; alta de cuentas desde el panel |
| Parametrización (categorías, prioridades, tiempos) | ✔ | Catálogos y tabla de SLA en `src/lib/ticket.ts` |
| **Carga del inventario de activos** | ✘ | El ticket no se asocia a un equipo del inventario; solo al número de puesto |
| Marcha blanca con casos reales | Org. | Hay tickets reales radicados en producción (códigos hasta `TCK-000078` al 30/09). El acta de incidencias debe levantarse aparte; el [historial de cambios](../../CHANGELOG.md) registra los ajustes hechos en esos días |
| Canal único de solicitudes | Org. | El sistema está disponible; la redirección de los canales informales es una decisión operativa |

## PDA 3 — Capacitación

| Actividad | Estado | Evidencia / observación |
|---|:-:|---|
| Manual de usuario | ✔ | [Manual de usuario](../07-manuales/manual-de-usuario.md) |
| Guía para soporte | ✔ | [Instructivo de administración](../07-manuales/instructivo-de-administracion.md) |
| Sesiones por grupo y registro de asistencia | Org. | Soportar con las listas de asistencia |
| Evaluación de comprensión | Org. | Soportar con las evaluaciones aplicadas |

## Hoja de ruta sugerida

| Prioridad | Mejora | Justificación |
|---|---|---|
| Alta | Notificaciones por correo al cerrar el ticket (y alerta al soporte con tickets Críticos) | Cierra el módulo pendiente del PDA 1 |
| Alta | Tablero de indicadores: volumen por categoría, área y team leader; promedios de respuesta y solución por mes | Indicadores de seguimiento del plan de trabajo |
| Media | Asociar el ticket a un equipo del inventario | Histórico de fallas por equipo (PDA 2) |
| Media | Límite de intentos de login | Ver [Seguridad](../05-seguridad/seguridad.md#6-riesgos-conocidos-y-recomendaciones) |
| Media | Migración a Next.js 15 | Cierra los avisos de `npm audit` |
| Baja | Pruebas automatizadas de las reglas de SLA y cola | Las reglas puras de `src/lib/ticket.ts` y `horario.ts` son fáciles de probar |
| Baja | Limpieza por antigüedad programada (Vercel Cron) | El endpoint ya existe |
