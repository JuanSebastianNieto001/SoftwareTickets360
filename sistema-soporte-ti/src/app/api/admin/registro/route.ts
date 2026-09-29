import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { esAdmin, obtenerSesionActual } from "@/lib/auth";

// GET /api/admin/registro?limite=100&usuarioId=... — bitacora de actividad.
//
// Solo el lider de TI: es el rastro de quien hizo que, y quien lo consulta
// no deberia poder ser quien aparece en el. El middleware solo comprueba que
// haya sesion, asi que el rol se verifica aqui.
export const dynamic = "force-dynamic";

/** Tope de filas por consulta. Evita traer una bitacora de meses de un golpe. */
const LIMITE_POR_DEFECTO = 100;
const LIMITE_MAXIMO = 500;

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesionActual();
  if (!esAdmin(sesion)) {
    return NextResponse.json(
      { error: "Solo el administrador puede ver la bitacora" },
      { status: 403 }
    );
  }

  const limiteParam = Number(request.nextUrl.searchParams.get("limite"));
  const limite = Number.isFinite(limiteParam) && limiteParam > 0
    ? Math.min(limiteParam, LIMITE_MAXIMO)
    : LIMITE_POR_DEFECTO;

  const usuarioId = request.nextUrl.searchParams.get("usuarioId")?.trim();

  const registros = await prisma.registroActividad.findMany({
    where: usuarioId ? { usuarioId } : {},
    orderBy: { fecha: "desc" },
    take: limite,
    select: {
      id: true,
      fecha: true,
      usuarioId: true,
      usuarioNombre: true,
      accion: true,
      detalle: true,
      ticketCodigo: true,
    },
  });

  return NextResponse.json({ registros });
}
