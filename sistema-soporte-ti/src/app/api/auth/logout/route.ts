import { NextResponse } from "next/server";
import { eliminarCookieSesion } from "@/lib/auth";

export async function POST() {
  await eliminarCookieSesion();
  return NextResponse.json({ ok: true });
}
