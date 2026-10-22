import { NextResponse } from "next/server";
import { db } from "@/db";
import { archivos } from "@/db/schema";
import { obtenerUsuario } from "@/lib/sesion";
import { puedeCrearPresupuestos } from "@/lib/datos";
import { borrarArchivo, guardarArchivo, TAMANO_MAXIMO, TIPOS_PERMITIDOS } from "@/lib/archivos";
import { ErrorExtraccion, extraccionDisponible, extraerCotizacion } from "@/lib/extraccion";
import { buscarCoincidencia } from "@/lib/coincidencias";
import { listarEquipos } from "@/lib/catalogo";
import { aCentavos } from "@/lib/dinero";
import { MENSAJE_ARCHIVO_GRANDE } from "@/lib/limites";
import type { BorradorAlternativa } from "@/lib/tipos";

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
  const extension = TIPOS_PERMITIDOS[archivo.type];
  if (!extension) {
    return NextResponse.json({ error: "Formato no permitido. Sube PDF, JPG, PNG, WEBP, Excel (.xlsx) o Word (.docx)." }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return NextResponse.json({ error: MENSAJE_ARCHIVO_GRANDE }, { status: 400 });
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const guardado = await guardarArchivo(buffer, extension, archivo.type);
  let registro;
  try {
    [registro] = await db
      .insert(archivos)
      .values({
        nombreOriginal: archivo.name,
        nombreGuardado: guardado.nombreGuardado,
        almacenamiento: guardado.almacenamiento,
        mime: archivo.type,
        tamano: archivo.size,
        subidoPor: usuario.id,
      })
      .returning();
  } catch (error) {
    await borrarArchivo(guardado.nombreGuardado, guardado.almacenamiento).catch((errorAlBorrar) => console.error(errorAlBorrar));
    throw error;
  }

  const base = { archivoId: registro.id, archivoNombre: registro.nombreOriginal };

  if (!extraccionDisponible()) {
    return NextResponse.json({
      ...base,
      aviso: "El archivo se adjuntó, pero la lectura automática no está configurada. Ingresa los ítems a mano.",
    });
  }

  try {
    const [datos, catalogo] = await Promise.all([
      extraerCotizacion(buffer, archivo.type, archivo.name),
      listarEquipos(db),
    ]);
    const borrador: BorradorAlternativa = {
      proveedor: datos.proveedor,
      tipoCompra: datos.tipoCompra,
      items: datos.items.map((it) => {
        const coincide = buscarCoincidencia(it, catalogo);
        return {
          equipoId: coincide?.id ?? null,
          equipoNombre: coincide?.nombre ?? null,
          nuevo: !coincide,
          descripcion: it.descripcion,
          marca: it.marca,
          modelo: it.modelo,
          cantidad: it.cantidad,
          precioUnitarioCentavos: aCentavos(it.precioUnitario) ?? 0,
          moneda: it.moneda,
        };
      }),
    };
    return NextResponse.json({ ...base, borrador });
  } catch (e) {
    const mensaje = e instanceof ErrorExtraccion ? e.message : "Error inesperado al leer la cotización.";
    if (!(e instanceof ErrorExtraccion)) console.error(e);
    return NextResponse.json({ ...base, aviso: `${mensaje} El archivo quedó adjunto; puedes ingresar los ítems a mano.` });
  }
}
