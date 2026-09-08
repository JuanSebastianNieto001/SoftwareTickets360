import { NextResponse } from "next/server";
import { eliminarCookieSesion } from "@/lib/auth";

// POST /api/auth/logout — borra la cookie de sesion. No requiere body ni valida sesion previa.
export async function POST() {
  await eliminarCookieSesion();
  return NextResponse.json({ ok: true });
}
