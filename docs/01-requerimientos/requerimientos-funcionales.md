# Requerimientos funcionales

**Proyecto:** Sistema de Gestión de Soporte TI (SoftwareTickets360)
**Empresa:** Dalmaru Inversiones S.A.S. — Área de Tecnología
**Responsable:** Juan Sebastián Nieto Castaño — Líder de TI-Soporte
**Plan de acción:** PDA 1 — Desarrollo del software de gestión de tickets (septiembre 2026)

## 1. Problema

Las solicitudes de soporte llegaban por canales dispersos (llamada, WhatsApp,
correo y solicitud verbal), sin registro único ni responsable asignado. El área no
podía medir tiempos de respuesta y solución, conocer su carga real de trabajo,
priorizar por impacto ni conservar el histórico de fallas. Las soluciones del
mercado implican licenciamiento y no se ajustan al flujo interno.

## 2. Objetivo

Contar con una herramienta propia que sea el **canal único** de solicitudes de
soporte: que registre cada caso, lo priorice, lo asigne a quien lo atiende, deje
constancia de la solución y mida los tiempos contra el acuerdo de nivel de
servicio.

## 3. Actores

| Actor | Acceso | Qué hace |
|---|---|---|
| **Colaborador** (asesor o administrativo) | Público, sin login | Radica tickets y consulta su estado con el código. |
| **Soporte** | `/soporte`, con usuario y contraseña | Atiende, prioriza y cierra tickets; exporta el historial. |
| **Líder de TI** (administrador) | `/admin`, con usuario y contraseña | Todo lo del soporte, más: eliminar tickets, gestionar cuentas y consultar la bitácora. |

## 4. Requerimientos

### Módulo de registro (público)

| ID | Requerimiento |
|---|---|
| RF-01 | El colaborador radica un ticket desde la página principal sin iniciar sesión. |
| RF-02 | Campos: nombre completo, área (Asesor / Administrativos), categoría y descripción. Si el área es **Asesor**, se piden además el **team leader** y el **número de puesto**. |
| RF-03 | Ningún campo obligatorio puede quedar vacío. Cada error se marca en rojo debajo del campo, con el motivo concreto. La misma validación se aplica en el servidor. |
| RF-04 | La **prioridad no la elige quien reporta**: se asigna según la categoría (ver §5.2). |
| RF-05 | Al radicar, el sistema entrega un código único `TCK-000123`. |
| RF-06 | Al radicar, el sistema muestra la **posición en la cola**, cuántos tickets hay delante y el **tiempo estimado** de primera respuesta. |

### Módulo de seguimiento (público)

| ID | Requerimiento |
|---|---|
| RF-07 | Con el código, cualquiera consulta el estado, la categoría, el área, la prioridad y la línea de tiempo del ticket. |
| RF-08 | Si el ticket sigue pendiente, la consulta muestra su posición actual en la cola y el tiempo estimado restante. |
| RF-09 | La consulta no expone datos personales del solicitante (nombre, puesto, descripción). |

### Módulo de atención (panel de soporte)

| ID | Requerimiento |
|---|---|
| RF-10 | El acceso al panel exige usuario y contraseña. La sesión expira a las 8 horas. |
| RF-11 | El panel lista los tickets **activos** (pendientes y en proceso) y, aparte, los **finalizados**, con contadores por estado. |
| RF-12 | Los pendientes se ordenan igual que la cola prometida al usuario: primero la prioridad más alta y, a igual prioridad, el más antiguo. |
| RF-13 | Búsqueda por código, nombre, puesto o área, y filtro por team leader con el conteo de tickets de cada uno. |
| RF-14 | **Asignación:** al pulsar "Voy en camino" el ticket pasa a EN PROCESO, queda asignado a quien lo tomó y se registra el tiempo de llegada. |
| RF-15 | Quien atiende puede cambiar la prioridad de un ticket abierto. Es la única forma de marcar un caso como **Crítica**. |
| RF-16 | **Cierre:** se registra la solución aplicada (mínimo 5 caracteres), la fecha de cierre y los tiempos de resolución y total. |
| RF-17 | Si el cierre queda fuera del SLA, el sistema exige una justificación (mínimo 10 caracteres). |
| RF-18 | El panel se actualiza solo cada 20 segundos mientras la pestaña está visible. |

### Módulo de reportes

| ID | Requerimiento |
|---|---|
| RF-19 | Exportación a Excel de los tickets finalizados, con solución, tiempos y cumplimiento del SLA. |
| RF-20 | Resumen de cumplimiento del SLA en la vista de finalizados (dentro / fuera / sin meta) y filtro para ver solo los incumplidos. |

### Módulo de administración (panel del líder de TI)

| ID | Requerimiento |
|---|---|
| RF-21 | Eliminar un ticket puntual, o todos los finalizados de una vez escribiendo `ELIMINAR` como confirmación. Los tickets abiertos no se borran en el borrado masivo. |
| RF-22 | Crear cuentas de soporte y restablecer su contraseña. No se pueden crear administradores desde la interfaz. |
| RF-23 | Consultar la bitácora de actividad: quién inició sesión, tomó, cerró, eliminó o repriorizó tickets, y quién gestionó cuentas. |
| RF-24 | Cada usuario autenticado puede cambiar su nombre visible ("Atendido por"). |

## 5. Reglas de negocio

### 5.1 Ciclo de vida del ticket

```
          Radicar                 "Voy en camino"              Cerrar
 (nadie) ─────────▶ PENDIENTE ───────────────────▶ EN PROCESO ─────────▶ CERRADO
                     │  fechaCreacion                │ fechaInicio          │ fechaCierre
                     │                               │ tiempoLlegada        │ tiempoResolucion
                     │                               │ adminId (asignado)   │ tiempoTotal, solucion
```

| Tiempo | Desde | Hasta |
|---|---|---|
| `tiempoLlegada` (primera respuesta) | Creación | "Voy en camino" |
| `tiempoResolucion` (solución) | "Voy en camino" | Cierre |
| `tiempoTotal` | Creación | Cierre |

### 5.2 Prioridad por categoría

| Categoría | Prioridad |
|---|---|
| Hardware, Software, Red / Internet, Accesos y credenciales | **Alta** |
| Correo electrónico | **Media** |
| Impresoras, Otro | **Baja** |

**Crítica** no la asigna ninguna categoría: depende del alcance ("detiene un área
completa, más de 10 personas"), que el formulario no pregunta. La marca quien
atiende, desde el panel, y solo mientras el ticket está abierto.

### 5.3 Acuerdo de nivel de servicio (SLA)

| Prioridad | Descripción | Primera respuesta | Máximo de solución |
|---|---|---|---|
| Crítica | Detiene la operación o un área completa (más de 10 personas) | 10 min (si las pruebas lo permiten) | Depende del tercero |
| Alta | Impide a un usuario trabajar, sin alternativa | 10 minutos | 10 minutos (si no involucra terceros) |
| Media | Afecta parcialmente; existe alternativa | En orden de llegada | 10 minutos (si no involucra terceros) |
| Baja | Solicitud, consulta o mejora | En orden de llegada | 10 minutos (si no involucra terceros) |

- **Solo el tiempo de solución decide** si un ticket cumplió el SLA. La primera
  respuesta se mide y se reporta, pero no marca el ticket como incumplido.
- Las metas "En orden de llegada" y "Depende del tercero" no tienen tope fijo:
  esos tickets aparecen como **Sin meta**, no como cumplidos.
- El veredicto no se guarda en la base: se recalcula con la prioridad y los
  tiempos, para que un ajuste de la tabla no deje históricos inconsistentes.

### 5.4 Cola de atención y estimado

- **Posición** = tickets pendientes de prioridad mayor + pendientes de la misma
  prioridad radicados antes + 1.
- **Estimado** = meta de primera respuesta de la prioridad + (tickets delante +
  tickets en proceso) × minutos promedio por ticket.
- Los minutos promedio salen del tiempo real de resolución de los tickets
  cerrados; si aún no hay historial se asumen 15 minutos.
- El estimado se redondea a múltiplos de 5 minutos (bajo una hora) o de 15
  (sobre una hora).
- Los minutos son de **jornada laboral** (lunes a viernes, 8:00 a 18:00, hora de
  Colombia): un ticket radicado fuera de horario empieza a contar en la siguiente
  apertura, y el sistema lo advierte.

### 5.5 Conservación de datos

- El borrado masivo elimina solo tickets finalizados; el flujo previsto es
  exportar a Excel y luego vaciar.
- Existe además una limpieza por antigüedad (cerrados con más de N días, mínimo
  7) para no agotar el plan gratuito de la base de datos.

## 6. Requerimientos no funcionales

| ID | Requerimiento |
|---|---|
| RNF-01 | Aplicación web adaptable a computador y celular. |
| RNF-02 | Contraseñas guardadas con hash bcrypt; nunca en texto plano. |
| RNF-03 | Sesión en cookie `httpOnly` firmada (JWT HS256), con expiración de 8 horas. |
| RNF-04 | Base de datos protegida con Row Level Security; sin acceso desde la API pública de Supabase. |
| RNF-05 | Operación dentro de los planes gratuitos de Vercel y Supabase (consumo estimado del panel: ~2,5 % del egress mensual). |
| RNF-06 | Toda acción sensible queda registrada en la bitácora; un fallo de la bitácora no impide la operación principal. |
