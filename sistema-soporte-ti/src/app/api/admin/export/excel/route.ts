import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { formatearMinutos } from "@/lib/ticket";

// GET /api/admin/export/excel?fecha=YYYY-MM-DD
// Genera el Excel diario de tickets cerrados (por defecto, el dia de hoy).
export async function GET(request: NextRequest) {
  const fechaParam = request.nextUrl.searchParams.get("fecha");
  const fecha = fechaParam ? new Date(`${fechaParam}T00:00:00`) : new Date();
  if (Number.isNaN(fecha.getTime())) {
    return NextResponse.json({ error: "Fecha invalida" }, { status: 400 });
  }

  const inicioDia = new Date(fecha);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(fecha);
  finDia.setHours(23, 59, 59, 999);

  const tickets = await prisma.ticket.findMany({
    where: { estado: "CERRADO", fechaCierre: { gte: inicioDia, lte: finDia } },
    include: { admin: { select: { nombre: true } } },
    orderBy: { fechaCierre: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Gestion de Soportes TI";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet("Tickets cerrados", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  hoja.columns = [
    { header: "Codigo", key: "codigo", width: 14 },
    { header: "Solicitante", key: "solicitante", width: 26 },
    { header: "Area", key: "area", width: 18 },
    { header: "Categoria", key: "categoria", width: 20 },
    { header: "Prioridad", key: "prioridad", width: 12 },
    { header: "Descripcion", key: "descripcion", width: 40 },
    { header: "Solucion", key: "solucion", width: 40 },
    { header: "Atendido por", key: "atendidoPor", width: 22 },
    { header: "Creado", key: "creado", width: 20 },
    { header: "Inicio atencion", key: "inicio", width: 20 },
    { header: "Cierre", key: "cierre", width: 20 },
    { header: "Tiempo de llegada", key: "tLlegada", width: 18 },
    { header: "Tiempo de resolucion", key: "tResolucion", width: 20 },
    { header: "Tiempo total", key: "tTotal", width: 16 },
  ];

  hoja.getRow(1).font = { bold: true };
  hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F49D1" } };
  hoja.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  const formatoFecha = (d: Date | null) =>
    d ? d.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "";

  for (const t of tickets) {
    hoja.addRow({
      codigo: t.codigoTicket,
      solicitante: t.nombreSolicitante,
      area: t.area,
      categoria: t.categoria,
      prioridad: t.prioridad,
      descripcion: t.descripcion,
      solucion: t.solucion ?? "",
      atendidoPor: t.admin?.nombre ?? "",
      creado: formatoFecha(t.fechaCreacion),
      inicio: formatoFecha(t.fechaInicio),
      cierre: formatoFecha(t.fechaCierre),
      tLlegada: formatearMinutos(t.tiempoLlegada),
      tResolucion: formatearMinutos(t.tiempoResolucion),
      tTotal: formatearMinutos(t.tiempoTotal),
    });
  }

  hoja.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = `tickets_cerrados_${inicioDia.toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
