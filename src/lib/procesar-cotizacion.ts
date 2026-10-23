import "server-only";
import { db } from "@/db";
import { archivos } from "@/db/schema";
import type { UsuarioActual } from "@/lib/sesion";
import { puedeCrearPresupuestos } from "@/lib/datos";
import { borrarArchivo, guardarArchivo, TAMANO_MAXIMO, TIPOS_PERMITIDOS, type AlmacenamientoArchivo } from "@/lib/archivos";
import { ErrorExtraccion, extraccionDisponible, extraerCotizacion } from "@/lib/extraccion";
import { buscarCoincidencia } from "@/lib/coincidencias";
import { listarEquipos } from "@/lib/catalogo";
import { aCentavos } from "@/lib/dinero";
import { MENSAJE_ARCHIVO_GRANDE } from "@/lib/limites";
import type { BorradorAlternativa, RespuestaExtraccion } from "@/lib/tipos";

export async function procesarCotizacion(
  usuario: UsuarioActual,
  archivo: { nombre: string; mime: string; tamano: number; buffer: Buffer },
  archivoExistente?: { nombreGuardado: string; almacenamiento: AlmacenamientoArchivo },
): Promise<RespuestaExtraccion> {
  if (!puedeCrearPresupuestos(usuario)) throw new Error("Tu rol no permite subir cotizaciones.");
  const extension = TIPOS_PERMITIDOS[archivo.mime];
  if (!extension) throw new Error("Formato no permitido. Sube PDF, JPG, PNG, WEBP, Excel (.xlsx) o Word (.docx).");
  if (archivo.tamano > TAMANO_MAXIMO || archivo.buffer.byteLength > TAMANO_MAXIMO) {
    throw new Error(MENSAJE_ARCHIVO_GRANDE);
  }

  const guardado = archivoExistente ?? await guardarArchivo(archivo.buffer, extension, archivo.mime);
  let registro;
  try {
    [registro] = await db
      .insert(archivos)
      .values({
        nombreOriginal: archivo.nombre,
        nombreGuardado: guardado.nombreGuardado,
        almacenamiento: guardado.almacenamiento,
        mime: archivo.mime,
        tamano: archivo.buffer.byteLength,
        subidoPor: usuario.id,
      })
      .returning();
  } catch (error) {
    if (!archivoExistente) {
      await borrarArchivo(guardado.nombreGuardado, guardado.almacenamiento)
        .catch((errorAlBorrar) => console.error("No se pudo limpiar el archivo tras fallar el registro.", errorAlBorrar));
    }
    throw error;
  }

  const base = { archivoId: registro.id, archivoNombre: registro.nombreOriginal };
  if (!extraccionDisponible()) {
    return {
      ...base,
      aviso: "El archivo se adjuntó, pero la lectura automática no está configurada. Ingresa los ítems a mano.",
    };
  }

  try {
    const [datos, catalogo] = await Promise.all([
      extraerCotizacion(archivo.buffer, archivo.mime, archivo.nombre),
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
    return { ...base, borrador };
  } catch (error) {
    const mensaje = error instanceof ErrorExtraccion ? error.message : "Error inesperado al leer la cotización.";
    if (!(error instanceof ErrorExtraccion)) console.error(error);
    return { ...base, aviso: `${mensaje} El archivo quedó adjunto; puedes ingresar los ítems a mano.` };
  }
}
