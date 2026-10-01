# Instructivo de administración — Atención de tickets

**Para:** personal de soporte TI y líder de TI.

| Perfil | Dirección de ingreso |
|---|---|
| Soporte | https://software-ticketsv0z360.vercel.app/soporte/login |
| Líder de TI | https://software-ticketsv0z360.vercel.app/admin/login |

## 1. Ingreso

1. Abra la dirección de su perfil.
2. Escriba su usuario y contraseña (el ícono del ojo muestra la contraseña).
3. La sesión dura **8 horas**. Para salir antes, use **Cerrar sesión** en la
   esquina superior.

Si el soporte intenta entrar por la dirección del líder, el sistema lo lleva a su
propio panel. Si olvida la contraseña, el líder de TI la restablece (§7).

## 2. El panel

| Zona | Contenido |
|---|---|
| Contadores | Total de tickets **Pendientes**, **En proceso** y **Cerrados**. |
| Pestañas | **Activos** (vista inicial: pendientes + en proceso), **Pendientes**, **En proceso**, **Finalizados**. |
| Búsqueda | Por código, nombre, puesto o área. |
| Team leader | Filtra por líder; el número entre paréntesis es su total de tickets. |
| Botones | **Exportar finalizados** (Excel). El líder ve además **Borrar finalizados**. |

El panel se actualiza solo cada 20 segundos mientras la pestaña está visible.

**Orden de atención.** Los pendientes aparecen primero por prioridad (Crítica,
Alta, Media, Baja) y, a igual prioridad, por antigüedad. Es el mismo orden con el
que se le calculó la posición en la cola al usuario: **atiéndalos en ese orden**
para que lo prometido se cumpla.

## 3. Atender un ticket

1. Revise la tarjeta: solicitante, puesto, área, team leader, categoría,
   prioridad y descripción.
2. Pulse **Voy en camino** al salir hacia el puesto. El ticket pasa a *En
   proceso*, queda **asignado a usted** y se registra el tiempo de llegada
   (primera respuesta).
3. Atienda el caso en sitio.

> El reloj del tiempo de solución arranca con "Voy en camino". Púlselo cuando
> realmente salga, no antes.

## 4. Cambiar la prioridad

Use **Cambiar prioridad** en un ticket abierto cuando la asignada por la
categoría no refleje el impacto real:

- **Subir a Crítica** si la falla detiene un área completa (más de 10
  personas). Es la única forma de asignar Crítica.
- **Bajar** si la categoría sobrestimó el caso.

No se puede cambiar la prioridad de un ticket cerrado: con ella se midió su SLA.

## 5. Cerrar un ticket

1. Pulse **Cerrar ticket**.
2. Escriba la **solución aplicada** (mínimo 5 caracteres): qué se hizo, no solo
   "resuelto".
3. El sistema muestra **Si lo cierras ahora:** si quedará dentro o fuera del SLA.
4. Si queda fuera, escriba **por qué se pasó del tiempo** (mínimo 10
   caracteres), por ejemplo: *"se escaló al proveedor de internet"*.
5. Pulse **Confirmar cierre**.

El ticket pasa a **Finalizados** con su fecha de cierre y tiempos.

### Metas de solución (SLA)

| Prioridad | Primera respuesta | Máximo de solución |
|---|---|---|
| Crítica | 10 min | Depende del tercero |
| Alta | 10 min | 10 min (si no involucra terceros) |
| Media | En orden de llegada | 10 min (si no involucra terceros) |
| Baja | En orden de llegada | 10 min (si no involucra terceros) |

El tiempo de solución se mide desde **Voy en camino** hasta el **cierre**, y es
el único que decide si se cumplió el SLA.

## 6. Consultar finalizados y exportar

- En **Finalizados**, cada ticket muestra cuánto tomó resolverlo y su chip de
  cumplimiento (*Dentro*, *Fuera* o *Sin meta*).
- **Cumplimiento del SLA** resume cuántos quedaron dentro y fuera.
- **Ver solo los que se pasaron del tiempo** filtra los incumplidos.
- **Ver solución** muestra la solución y, si aplica, el motivo del
  incumplimiento.
- **Exportar finalizados** descarga un Excel con todos los cerrados, con
  tiempos, metas y cumplimiento.

## 7. Funciones del líder de TI

### Borrar tickets
- **Borrar finalizados (N):** elimina los cerrados. Pide escribir
  `ELIMINAR`. Los abiertos no se tocan. **Exporte antes a Excel**: lo borrado no
  se recupera.
- **Conservar algunos:** en la pestaña **Finalizados**, marque la casilla
  **Conservar** en los tickets que no deben borrarse. El botón rojo muestra
  cuántos se borrarán y cuántos se conservan, por ejemplo *Borrar finalizados
  (79 · conserva 3)*. El atajo **Conservar los cerrados este mes** marca de una
  vez los cerrados en el mes en curso: sirve para vaciar el mes anterior el día
  1 sin perder los de hoy. **Quitar marcas** las limpia. Después de un borrado
  las marcas se quitan solas.
- **Eliminar ticket** (ícono de papelera): borra un ticket puntual, en cualquier
  estado. Úselo para pruebas o duplicados.

### Cuentas
En la sección **Cuentas**:
- **Crear cuenta de soporte:** nombre, correo y contraseña (mínimo 8
  caracteres). Siempre se crea con perfil de soporte.
- **Restablecer contraseña:** asigna una nueva sin pedir la anterior.

Las cuentas de administrador no se crean desde el panel, por seguridad.

### Registro de actividad
La sección **Registro de actividad** muestra quién inició sesión, tomó, cerró,
eliminó o repriorizó tickets, y quién creó cuentas o cambió contraseñas. Se
puede filtrar por persona (**Todas las personas**).

## 8. Cambiar su nombre visible

Pulse el ícono junto al saludo (**Cambiar mi nombre**). Ese nombre aparece como
*Atendido por* en los tickets que usted atiende, incluidos los ya cerrados.

## 9. Rutina recomendada

| Cuándo | Qué |
|---|---|
| Al iniciar la jornada | Ingresar y dejar el panel abierto. |
| Durante la jornada | Atender en el orden del panel; "Voy en camino" al salir; cerrar con la solución real. |
| Cada 2 a 3 días | Líder: **Exportar finalizados**, guardar el Excel, luego **Borrar finalizados**. |
| Semanal | Líder: revisar el resumen de SLA y el registro de actividad. |
