import { NextResponse } from "next/server";
import { obtenerUsuario } from "@/lib/sesion";
import { puedeCrearPresupuestos } from "@/lib/datos";
import { TAMANO_MAXIMO, TIPOS_PERMITIDOS } from "@/lib/archivos";
import { MENSAJE_ARCHIVO_GRANDE } from "@/lib/limites";
import { registrarCotizacion } from "@/lib/procesar-cotizacion";

// Máximo del plan gratis (Hobby) de Vercel con Fluid compute: 300 segundos.
export const maxDuration = 300;

/**
 * Recibe y guarda el archivo. La lectura con IA se solicita después, aparte,
 * para que el formulario pueda mostrar la cotización en cuanto se suba.
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
    return NextResponse.json({ error: "Formato no permitido. Sube PDF, JPG, PNG, WEBP, Excel (.xlsx) o Word (.docx)." }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return NextResponse.json({ error: MENSAJE_ARCHIVO_GRANDE }, { status: 400 });
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  try {
    return NextResponse.json(await registrarCotizacion(usuario, {
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
