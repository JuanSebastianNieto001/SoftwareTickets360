import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { formatearMinutos } from "@/lib/ticket";

// Obligatorio: esta ruta no lee `request` ni cookies, y sin esto Next.js la
// trata como estatica, la ejecuta una sola vez durante el build y despues
// devuelve siempre ese mismo Excel congelado (con los tickets que existian
// al momento de compilar). Tiene que consultar la base en cada descarga.
export const dynamic = "force-dynamic";

// Estados legibles para la columna del Excel (en la base se guardan en mayuscula fija).
const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  CERRADO: "Cerrado",
};

// GET /api/admin/export/excel
// Exporta TODOS los tickets que haya en la base de datos en este momento,
// sin filtrar por fecha ni por estado.
//
// Antes exportaba solo los cerrados del dia. Se cambio porque el flujo real
// es: exportar y despues vaciar la base. Si pasan dos o tres dias sin
// vaciarla, el Excel igual tiene que traer todo lo acumulado, y tambien los
// que quedaron abiertos, para que al vaciar no se pierda ningun registro.
export async function GET() {
  const tickets = await prisma.ticket.findMany({
    include: { admin: { select: { nombre: true } } },
    orderBy: { fechaCreacion: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Gestion de Soportes TI";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet("Tickets", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  hoja.columns = [
    { header: "Codigo", key: "codigo", width: 14 },
    { header: "Solicitante", key: "solicitante", width: 26 },
    { header: "Puesto", key: "puesto", width: 10 },
    { header: "Area", key: "area", width: 18 },
    { header: "Categoria", key: "categoria", width: 20 },
    { header: "Prioridad", key: "prioridad", width: 12 },
    // El export ya no es solo de cerrados, asi que hay que poder distinguirlos.
    { header: "Estado", key: "estado", width: 14 },
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
      puesto: t.numeroPuesto,
      area: t.area,
      categoria: t.categoria,
      prioridad: t.prioridad,
      estado: ETIQUETA_ESTADO[t.estado] ?? t.estado,
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
  // La fecha del nombre es la de descarga, para poder guardar varios exports
  // seguidos sin que se pisen entre ellos.
  const nombreArchivo = `tickets_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
