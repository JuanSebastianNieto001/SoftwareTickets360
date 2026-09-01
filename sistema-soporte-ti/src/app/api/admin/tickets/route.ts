import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/tickets?estado=PENDIENTE — listado para el panel. Protegido por middleware.
export async function GET(request: NextRequest) {
  const estado = request.nextUrl.searchParams.get("estado");
  const busqueda = request.nextUrl.searchParams.get("q")?.trim();

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(estado && ["PENDIENTE", "EN_PROCESO", "CERRADO"].includes(estado)
        ? { estado: estado as "PENDIENTE" | "EN_PROCESO" | "CERRADO" }
        : {}),
      ...(busqueda
        ? {
            OR: [
              { codigoTicket: { contains: busqueda } },
              { nombreSolicitante: { contains: busqueda } },
              { correo: { contains: busqueda } },
              { area: { contains: busqueda } },
            ],
          }
        : {}),
    },
    orderBy: [{ estado: "asc" }, { fechaCreacion: "desc" }],
    include: { admin: { select: { nombre: true } } },
  });

  return NextResponse.json({ tickets });
}
