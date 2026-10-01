# Casos de prueba funcionales

Pruebas manuales para validar el sistema antes de cada puesta en producción y
después de cambios importantes. El proyecto no tiene todavía pruebas
automatizadas; la verificación técnica mínima es `npm run build`, que compila y
revisa los tipos de todo el código.

**Cómo usar este documento:** ejecutar cada caso, marcar el resultado (✔ / ✘) y
anotar observaciones. Se recomienda usar tickets de prueba con el nombre
"PRUEBA" y eliminarlos al terminar desde el panel del líder.

| Ejecutado por | Fecha | Entorno | Versión / commit |
|---|---|---|---|
| | | | |

## 1. Registro de tickets (público)

| ID | Caso | Pasos | Resultado esperado | ✔/✘ |
|---|---|---|---|---|
| CP-01 | Radicar como asesor | Área Asesor, team leader, puesto `12`, categoría Software, descripción válida | Código `TCK-…`, prioridad Alta, posición en la cola y estimado | |
| CP-02 | Radicar como administrativo | Área Administrativos | No pide team leader ni puesto; se crea el ticket | |
| CP-03 | Campos vacíos | Enviar el formulario vacío | Cada campo en rojo: "Este campo es obligatorio"; no se envía | |
| CP-04 | Puesto con letras | Puesto `12A` | "El numero del puesto solo puede tener numeros" | |
| CP-05 | Descripción corta | Menos de 10 caracteres | Mensaje de mínimo 10 caracteres | |
| CP-06 | Prioridad por categoría | Radicar Correo electrónico, luego Impresoras | Media y Baja respectivamente | |
| CP-07 | Prioridad forzada | Enviar `prioridad: "CRITICA"` directo a `POST /api/tickets` | Se ignora; queda la de la categoría | |
| CP-08 | Fuera de horario | Radicar un sábado o después de 6 p. m. | Aviso de fuera de horario; estimado desde la siguiente apertura | |

## 2. Cola de atención

| ID | Caso | Pasos | Resultado esperado | ✔/✘ |
|---|---|---|---|---|
| CP-09 | Posición por llegada | Con la cola vacía, radicar dos tickets Baja | Posiciones #1 y #2 | |
| CP-10 | Prioridad adelanta | Luego radicar uno Alta | Queda #1; los Baja pasan a #2 y #3 al consultarlos | |
| CP-11 | Coincidencia con el panel | Comparar las posiciones con la pestaña Pendientes | Mismo orden | |

## 3. Seguimiento (público)

| ID | Caso | Pasos | Resultado esperado | ✔/✘ |
|---|---|---|---|---|
| CP-12 | Consultar pendiente | Buscar el código de CP-01 | Estado Pendiente, posición actual y estimado | |
| CP-13 | Consultar en proceso | Tras "Voy en camino" | Estado En proceso, sin bloque de cola, con hora de inicio | |
| CP-14 | Consultar cerrado | Tras el cierre | Estado Cerrado, solución y tiempos | |
| CP-15 | Código inexistente | Buscar `TCK-999999` | "No existe un ticket con ese codigo" | |
| CP-16 | Privacidad | Revisar la respuesta de la consulta | Sin nombre, puesto, team leader, descripción ni id | |

## 4. Acceso y perfiles

| ID | Caso | Pasos | Resultado esperado | ✔/✘ |
|---|---|---|---|---|
| CP-17 | Login correcto | Credenciales de soporte en `/soporte/login` | Entra al panel de soporte | |
| CP-18 | Login incorrecto | Contraseña errada | "Correo o contrasena incorrectos" | |
| CP-19 | Ruta protegida | Abrir `/soporte` sin sesión | Redirige al login | |
| CP-20 | Soporte en `/admin` | Con sesión de soporte, abrir `/admin` | Redirige a `/soporte` | |
| CP-21 | API sin permiso | Con sesión de soporte, `DELETE /api/admin/tickets/:id` | 403 | |
| CP-22 | Cerrar sesión | Pulsar Cerrar sesión y volver a `/soporte` | Pide login | |

## 5. Atención y cierre

| ID | Caso | Pasos | Resultado esperado | ✔/✘ |
|---|---|---|---|---|
| CP-23 | Voy en camino | Pulsarlo en un pendiente | Pasa a En proceso, asignado al usuario, con tiempo de llegada | |
| CP-24 | Doble inicio | Repetir sobre el mismo ticket (dos pestañas) | "El ticket ya fue iniciado o esta cerrado" | |
| CP-25 | Escalar a Crítica | Cambiar prioridad de un abierto a Crítica | Se actualiza y se registra en la bitácora | |
| CP-26 | Cierre dentro del SLA | Cerrar antes de 10 min con solución | Cerrado, chip Dentro, sin pedir justificación | |
| CP-27 | Cierre fuera del SLA | Cerrar después de 10 min | Pide justificación; sin ella no cierra | |
| CP-28 | Solución vacía | Confirmar sin solución | Mensaje de mínimo 5 caracteres | |

## 6. Reportes y administración

| ID | Caso | Pasos | Resultado esperado | ✔/✘ |
|---|---|---|---|---|
| CP-29 | Exportar | Pulsar Exportar finalizados | Descarga `.xlsx` con los cerrados y columnas de SLA | |
| CP-30 | Filtro de incumplidos | En Finalizados, marcar "Ver solo los que se pasaron del tiempo" | Solo tickets Fuera | |
| CP-31 | Borrado masivo | Líder: Borrar finalizados, escribir `ELIMINAR` | Se borran solo los cerrados; los abiertos siguen | |
| CP-32 | Crear cuenta | Líder: crear cuenta con contraseña de 6 caracteres | Rechaza por mínimo 8; con 8 la crea con perfil soporte | |
| CP-33 | Restablecer contraseña | Líder: restablecer y entrar con la nueva | Ingreso correcto | |
| CP-34 | Bitácora | Revisar Registro de actividad tras los casos anteriores | Aparecen inicios de sesión, inicios, cierres, borrados y cuentas | |
| CP-35 | Cambiar nombre | Cambiar el nombre visible | Se refleja en el saludo y en "Atendido por" | |

## Observaciones

| ID | Observación | Acción |
|---|---|---|
| | | |
