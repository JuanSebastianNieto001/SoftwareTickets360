# SoftwareTickets360 — Sistema de Gestión de Soporte TI

Software propio del Área de Tecnología de **Dalmaru Inversiones S.A.S.** (marca
**VOZ360**) para recibir, priorizar, atender y cerrar las solicitudes de soporte
técnico de la operación, con trazabilidad completa y medición del acuerdo de
nivel de servicio (SLA).

| | |
|---|---|
| **Responsable** | Juan Sebastián Nieto Castaño — Líder de TI-Soporte |
| **Plan de trabajo** | Septiembre 2026 · Frente 1 (PDA 1, PDA 2 y PDA 3) |
| **Producción** | https://software-ticketsv0z360.vercel.app |
| **Repositorio** | https://github.com/JuanSebastianNieto001/SoftwareTickets360 |
| **Versión** | 1.0.0 (ver [CHANGELOG.md](CHANGELOG.md)) |

## Qué resuelve

Antes de este sistema las solicitudes de soporte llegaban por llamada, WhatsApp,
correo o de forma verbal, sin registro único, sin responsable asignado y sin forma
de medir tiempos. El sistema establece un **canal único**:

1. Cualquier colaborador radica un ticket desde un enlace público, sin iniciar
   sesión, y recibe un código (`TCK-000123`), su **posición en la cola** y un
   **tiempo estimado** de primera respuesta.
2. Con ese código consulta en cualquier momento el estado de su solicitud.
3. El personal de soporte atiende los tickets desde un panel privado: los toma
   ("Voy en camino"), los cierra con la solución aplicada y el sistema calcula los
   tiempos y el cumplimiento del SLA.
4. El líder de TI administra las cuentas, consulta la bitácora de actividad y
   exporta el historial a Excel.

## Estructura del repositorio

```
SoftwareTickets360/
├── README.md                  Este documento (portada del proyecto)
├── CHANGELOG.md               Historial de versiones y cambios
├── docs/                      Documentación funcional y técnica
│   ├── README.md              Índice de la documentación
│   ├── 01-requerimientos/     Requerimientos funcionales y reglas de negocio
│   ├── 02-arquitectura/       Arquitectura, stack y organización del código
│   ├── 03-base-de-datos/      Modelo de datos y migraciones
│   ├── 04-api/                Referencia de la API REST
│   ├── 05-seguridad/          Controles de seguridad y riesgos conocidos
│   ├── 06-despliegue/         Instalación, despliegue y operación
│   ├── 07-manuales/           Manual de usuario e instructivo de administración
│   ├── 08-pruebas/            Casos de prueba funcionales
│   └── 09-gestion/            Alcance entregado, pendientes y hoja de ruta
└── sistema-soporte-ti/        Código fuente de la aplicación (Next.js)
    ├── prisma/                Esquema de base de datos, migraciones y seed
    ├── public/                Recursos estáticos (logo)
    └── src/
        ├── app/               Páginas y API (App Router de Next.js)
        ├── components/
        │   ├── publico/       Pantallas sin login: formulario y seguimiento
        │   ├── panel/         Paneles de soporte y del líder de TI
        │   ├── ui/            Piezas reutilizables: insignias e íconos
        │   └── layout/        Encabezado, pie y logotipos
        ├── lib/               Reglas de negocio, autenticación y acceso a datos
        └── middleware.ts      Control de acceso a las rutas privadas
```

## Inicio rápido (desarrollo)

```bash
cd sistema-soporte-ti
npm install
cp .env.example .env        # completar credenciales de base de datos y cuentas
npx prisma migrate deploy   # crea las tablas
npm run seed                # crea las cuentas de líder de TI y soporte
npm run dev                 # http://localhost:3000
```

El detalle completo está en [docs/06-despliegue/despliegue-y-operacion.md](docs/06-despliegue/despliegue-y-operacion.md).

## Documentación

Empiece por el [índice de la documentación](docs/README.md). Para cada público:

- **Colaboradores que reportan:** [Manual de usuario](docs/07-manuales/manual-de-usuario.md)
- **Soporte y líder de TI:** [Instructivo de administración](docs/07-manuales/instructivo-de-administracion.md)
- **Desarrollo y mantenimiento:** [Arquitectura](docs/02-arquitectura/arquitectura.md), [API](docs/04-api/referencia-api.md), [Base de datos](docs/03-base-de-datos/modelo-de-datos.md)
- **Seguimiento del PDA:** [Alcance y pendientes](docs/09-gestion/alcance-y-pendientes.md)

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma ORM · PostgreSQL
(Supabase) · JWT con `jose` · `bcryptjs` · `exceljs` · Vercel.
