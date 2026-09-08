import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const correo = process.env.ADMIN_EMAIL ?? "admin@empresa.com";
  const password = process.env.ADMIN_PASSWORD ?? "CambiaEstaClave123";
  const nombre = process.env.ADMIN_NOMBRE ?? "Administrador";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { correo },
    update: { nombre, passwordHash },
    create: { nombre, correo, passwordHash, rol: "ADMIN" },
  });

  console.log(`Administrador listo: ${admin.correo} (${admin.nombre})`);

  const totalTickets = await prisma.ticket.count();
  if (totalTickets === 0) {
    await prisma.ticket.create({
      data: {
        codigoTicket: "TCK-000001",
        nombreSolicitante: "Colaborador de prueba",
        numeroPuesto: "12",
        area: "Asesor",
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
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
