import { NextResponse } from "next/server";
import { ErrorArchivoCotizacion, extraerCotizacionRegistrada } from "@/lib/procesar-cotizacion";
import { obtenerUsuario } from "@/lib/sesion";

export const maxDuration = 300;

export async function POST(_request: Request, { params }: { params: Promise<{ archivoId: string }> }) {
  const usuario = await obtenerUsuario();
  if (!usuario) return NextResponse.json({ error: "Tu sesión expiró." }, { status: 401 });

  const { archivoId } = await params;
  try {
    return NextResponse.json(await extraerCotizacionRegistrada(usuario, archivoId));
  } catch (error) {
    if (error instanceof ErrorArchivoCotizacion) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
