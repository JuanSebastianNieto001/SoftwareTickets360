# Documentación — Sistema de Gestión de Soporte TI

Índice de la documentación del proyecto SoftwareTickets360. Los documentos están
numerados en el orden en que conviene leerlos.

| # | Documento | Contenido | Público |
|---|---|---|---|
| 01 | [Requerimientos funcionales](01-requerimientos/requerimientos-funcionales.md) | Actores, requerimientos, reglas de negocio, SLA y flujo del ticket | Gerencia, líder de TI, desarrollo |
| 02 | [Arquitectura](02-arquitectura/arquitectura.md) | Stack, componentes, organización del código y decisiones de diseño | Desarrollo |
| 03 | [Modelo de datos](03-base-de-datos/modelo-de-datos.md) | Tablas, campos, índices y migraciones | Desarrollo |
| 04 | [Referencia de la API](04-api/referencia-api.md) | Endpoints, parámetros, permisos y respuestas | Desarrollo |
| 05 | [Seguridad](05-seguridad/seguridad.md) | Autenticación, roles, protección de datos y riesgos conocidos | Líder de TI, desarrollo |
| 06 | [Despliegue y operación](06-despliegue/despliegue-y-operacion.md) | Instalación local, variables de entorno, Vercel, mantenimiento | Líder de TI, desarrollo |
| 07 | [Manual de usuario](07-manuales/manual-de-usuario.md) | Cómo radicar un ticket y consultar su estado | Colaboradores, team leaders |
| 07 | [Instructivo de administración](07-manuales/instructivo-de-administracion.md) | Atención de tickets, SLA, cuentas, bitácora y Excel | Soporte, líder de TI |
| 08 | [Casos de prueba](08-pruebas/casos-de-prueba.md) | Pruebas funcionales por módulo | Líder de TI, desarrollo |
| 09 | [Alcance y pendientes](09-gestion/alcance-y-pendientes.md) | Qué se entregó frente al PDA y qué queda para siguientes fases | Gerencia, líder de TI |

El historial de cambios está en [CHANGELOG.md](../CHANGELOG.md).

## Convenciones

- El código fuente está en `sistema-soporte-ti/`. Las rutas de archivo de esta
  documentación son relativas a esa carpeta salvo que se indique lo contrario.
- Los textos del código y la interfaz se escriben sin tildes por compatibilidad;
  la documentación sí las usa.
- La fuente de verdad de los catálogos (áreas, categorías, prioridades, team
  leaders, SLA) es `src/lib/ticket.ts`. Si este documento y el código difieren,
  manda el código, y el documento debe corregirse.
