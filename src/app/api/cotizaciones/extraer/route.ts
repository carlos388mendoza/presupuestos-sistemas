import { NextResponse } from "next/server";
import { obtenerUsuario } from "@/lib/sesion";
import { puedeCrearPresupuestos } from "@/lib/datos";
import { TAMANO_MAXIMO, TIPOS_PERMITIDOS } from "@/lib/archivos";
import { MENSAJE_ARCHIVO_GRANDE } from "@/lib/limites";
import { procesarCotizacion } from "@/lib/procesar-cotizacion";

// Máximo del plan gratis (Hobby) de Vercel con Fluid compute: 300 segundos.
export const maxDuration = 300;

/**
 * Recibe el archivo de una cotización, lo guarda y (si la IA está configurada)
 * devuelve un borrador de alternativa para que el usuario lo revise.
 * Nada se guarda en el presupuesto hasta que el usuario confirma.
 */
export async function POST(req: Request) {
  const usuario = await obtenerUsuario();
  if (!usuario) return NextResponse.json({ error: "Tu sesión expiró." }, { status: 401 });
  if (!puedeCrearPresupuestos(usuario)) {
    return NextResponse.json({ error: "Tu rol no permite subir cotizaciones." }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const archivo = form?.get("archivo");
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS[archivo.type]) {
    return NextResponse.json({ error: "Formato no permitido. Sube un PDF, JPG, PNG o WEBP." }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return NextResponse.json({ error: MENSAJE_ARCHIVO_GRANDE }, { status: 400 });
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  try {
    return NextResponse.json(await procesarCotizacion(usuario, {
      nombre: archivo.name,
      mime: archivo.type,
      tamano: archivo.size,
      buffer,
    }));
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith("Formato no permitido") || error.message === MENSAJE_ARCHIVO_GRANDE)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
