import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/admin/limpieza?dias=30
// Borra tickets CERRADOS con mas de N dias desde su cierre, para evitar
// saturar el plan gratuito de la base de datos (limpieza progresiva).
//
// No hay ningun boton en la UI que llame esta ruta: es un endpoint de
// mantenimiento pensado para dispararse manualmente (o via un cron externo,
// ej. Vercel Cron) cuando se quiera una limpieza automatica por antiguedad.
// El borrado manual desde el panel (individual o "vaciar todo", ver
// src/app/api/admin/tickets/route.ts y .../tickets/[id]/route.ts) es el
// mecanismo que sí usa el administrador dia a dia.
export async function POST(request: NextRequest) {
  const diasParam = request.nextUrl.searchParams.get("dias");
  const dias = diasParam ? Number(diasParam) : 30;

  if (!Number.isFinite(dias) || dias < 7) {
    return NextResponse.json({ error: "El parametro dias debe ser un numero >= 7" }, { status: 400 });
  }

  const limite = new Date();
  limite.setDate(limite.getDate() - dias);

  const resultado = await prisma.ticket.deleteMany({
    where: { estado: "CERRADO", fechaCierre: { lt: limite } },
  });

  return NextResponse.json({
    eliminados: resultado.count,
    mensaje: `Se eliminaron ${resultado.count} tickets cerrados hace mas de ${dias} dias.`,
  });
}
