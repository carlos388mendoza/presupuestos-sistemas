import { NextResponse } from "next/server";
import { ErrorArchivoCotizacion, extraerCotizacionRegistrada } from "@/lib/procesar-cotizacion";
import { obtenerUsuario } from "@/lib/sesion";

export const maxDuration = 300;

export async function POST(request: Request, { params }: { params: Promise<{ archivoId: string }> }) {
  const usuario = await obtenerUsuario();
  if (!usuario) return NextResponse.json({ error: "Tu sesión expiró." }, { status: 401 });

  const { archivoId } = await params;
  const body = await request.json().catch(() => ({})) as { presupuestoId?: unknown };
  const presupuestoId = typeof body.presupuestoId === "string" ? body.presupuestoId : undefined;
  try {
    return NextResponse.json(await extraerCotizacionRegistrada(usuario, archivoId, presupuestoId));
  } catch (error) {
    if (error instanceof ErrorArchivoCotizacion) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
