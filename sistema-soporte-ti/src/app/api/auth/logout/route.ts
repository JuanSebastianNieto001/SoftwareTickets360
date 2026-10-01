import { NextRequest, NextResponse } from "next/server";
import { eliminarCookieSesion } from "@/lib/auth";
import { CABECERA_PANEL, aPanel } from "@/lib/panel";

// POST /api/auth/logout — cierra la sesion del panel que llama (cabecera
// x-panel). La del otro panel sigue abierta: son pestanas independientes.
// Sin cabecera se cierran las dos, que es lo seguro ante la duda.
export async function POST(request: NextRequest) {
  const panel = aPanel(request.headers.get(CABECERA_PANEL));
  if (panel) {
    await eliminarCookieSesion(panel);
  } else {
    await eliminarCookieSesion("admin");
    await eliminarCookieSesion("soporte");
  }
  return NextResponse.json({ ok: true });
}
