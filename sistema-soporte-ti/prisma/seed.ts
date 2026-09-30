// Siembra las cuentas del sistema. Es el unico lugar donde nacen:
//
//   ADMIN   -> el lider de TI. Entra por /admin y puede borrar tickets,
//              gestionar cuentas y leer la bitacora.
//   SOPORTE -> quien atiende. Entra por /soporte, atiende y consulta.
//
// Las contrasenas NO estan en el codigo: se leen de variables de entorno y
// el script se niega a correr si faltan. Un valor por defecto aqui terminaria
// publicado en el repositorio, que es justo como se filtran estas cosas.
//
// Uso:
//   ADMIN_PASSWORD=... SOPORTE_PASSWORD=... npm run seed
//
// Es idempotente: se puede volver a correr para cambiarle la contrasena a
// una cuenta existente sin duplicarla.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Lee una variable obligatoria o aborta con un mensaje que dice que falta. */
function exigir(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor || valor.trim() === "") {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Definela antes de correr el seed; ` +
        `no hay valor por defecto a proposito, para no dejar una contrasena en el codigo.`
    );
  }
  return valor;
}

const MIN_PASSWORD = 8;

function exigirPassword(nombre: string): string {
  const valor = exigir(nombre);
  if (valor.length < MIN_PASSWORD) {
    throw new Error(`${nombre} debe tener al menos ${MIN_PASSWORD} caracteres.`);
  }
  return valor;
}

async function sembrarCuenta(opciones: {
  correo: string;
  nombre: string;
  password: string;
  rol: "ADMIN" | "SOPORTE";
}) {
  const correo = opciones.correo.toLowerCase();
  const passwordHash = await bcrypt.hash(opciones.password, 10);

  const usuario = await prisma.user.upsert({
    where: { correo },
    // El nombre tambien se reafirma. Es deliberado: la cuenta puede haber
    // sido renombrada desde el panel por quien la venia usando, y el seed
    // es justamente donde se declara a quien pertenece cada una.
    update: { nombre: opciones.nombre, passwordHash, rol: opciones.rol },
    create: { nombre: opciones.nombre, correo, passwordHash, rol: opciones.rol },
  });

  console.log(`${opciones.rol} listo: ${usuario.correo} (${usuario.nombre})`);
}

async function main() {
  await sembrarCuenta({
    correo: process.env.ADMIN_EMAIL ?? "admin",
    nombre: process.env.ADMIN_NOMBRE ?? "Lider de TI",
    password: exigirPassword("ADMIN_PASSWORD"),
    rol: "ADMIN",
  });

  // La cuenta de soporte es opcional: si no se define su contrasena, el seed
  // siembra solo la de administrador, que despues puede crear las de soporte
  // desde el panel.
  if (process.env.SOPORTE_PASSWORD) {
    await sembrarCuenta({
      correo: process.env.SOPORTE_EMAIL ?? "soporte@voz360.co",
      nombre: process.env.SOPORTE_NOMBRE ?? "Soporte TI",
      password: exigirPassword("SOPORTE_PASSWORD"),
      rol: "SOPORTE",
    });
  } else {
    console.log("SOPORTE_PASSWORD no definida: no se sembro cuenta de soporte.");
  }

  // Ticket de ejemplo para tener algo que ver en un entorno recien montado.
  // Solo si la tabla esta vacia, asi que en produccion nunca se dispara.
  const totalTickets = await prisma.ticket.count();
  if (totalTickets === 0) {
    await prisma.ticket.create({
      data: {
        codigoTicket: "TCK-000001",
        nombreSolicitante: "Colaborador de prueba",
        numeroPuesto: "12",
        area: "Asesor",
        teamLeader: "Marko Velez",
        categoria: "Software",
        descripcion: "Ticket de ejemplo generado por el script de seed para verificar el panel.",
        estado: "PENDIENTE",
        prioridad: "MEDIA",
      },
    });
    console.log("Ticket de ejemplo creado (TCK-000001).");
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
