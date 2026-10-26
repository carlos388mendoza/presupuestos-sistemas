import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { archivos } from "@/db/schema";
import type { UsuarioActual } from "@/lib/sesion";
import { ErrorNegocio, obtenerPresupuesto, permisosPresupuesto, puedeCrearPresupuestos } from "@/lib/datos";
import { borrarArchivo, guardarArchivo, leerArchivo, TAMANO_MAXIMO, TIPOS_PERMITIDOS, type AlmacenamientoArchivo } from "@/lib/archivos";
import { ErrorExtraccion, ErrorPdfEscaneado, extraccionDisponible, extraerCotizacion } from "@/lib/extraccion";
import { buscarCoincidencia } from "@/lib/coincidencias";
import { listarEquipos } from "@/lib/catalogo";
import { aCentavos } from "@/lib/dinero";
import { MENSAJE_ARCHIVO_GRANDE } from "@/lib/limites";
import type { BorradorAlternativa, RespuestaArchivoSubido, RespuestaExtraccion } from "@/lib/tipos";

export class ErrorArchivoCotizacion extends Error {}

export async function registrarCotizacion(
  usuario: UsuarioActual,
  archivo: { nombre: string; mime: string; tamano: number; buffer?: Buffer },
  archivoExistente?: { nombreGuardado: string; almacenamiento: AlmacenamientoArchivo },
): Promise<RespuestaArchivoSubido> {
  if (!puedeCrearPresupuestos(usuario)) throw new Error("Tu rol no permite subir cotizaciones.");
  const extension = TIPOS_PERMITIDOS[archivo.mime];
  if (!extension) throw new Error("Formato no permitido. Sube PDF, JPG, PNG, WEBP, Excel (.xlsx) o Word (.docx).");
  if (archivo.tamano > TAMANO_MAXIMO || (archivo.buffer && archivo.buffer.byteLength > TAMANO_MAXIMO)) {
    throw new Error(MENSAJE_ARCHIVO_GRANDE);
  }
  if (!archivo.buffer && !archivoExistente) throw new Error("No se recibió el contenido del archivo.");

  const guardado = archivoExistente ?? await guardarArchivo(archivo.buffer!, extension, archivo.mime);
  let registro;
  try {
    [registro] = await db
      .insert(archivos)
      .values({
        nombreOriginal: archivo.nombre,
        nombreGuardado: guardado.nombreGuardado,
        almacenamiento: guardado.almacenamiento,
        mime: archivo.mime,
        tamano: archivo.tamano,
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

  return { archivoId: registro.id, archivoNombre: registro.nombreOriginal };
}

export async function extraerCotizacionRegistrada(
  usuario: UsuarioActual,
  archivoId: string,
  presupuestoId?: string,
): Promise<RespuestaExtraccion> {
  if (!puedeCrearPresupuestos(usuario)) throw new ErrorArchivoCotizacion("Tu rol no permite procesar cotizaciones.");
  const [registro] = await db.select().from(archivos).where(eq(archivos.id, archivoId)).limit(1);
  if (!registro || (registro.subidoPor !== usuario.id && usuario.role !== "admin")) {
    throw new ErrorArchivoCotizacion("No se encontró el archivo o no tienes acceso.");
  }

  const base = { archivoId: registro.id, archivoNombre: registro.nombreOriginal };
  let categorias: { id: string; nombre: string }[] | undefined;
  if (presupuestoId) {
    try {
      const presupuesto = await obtenerPresupuesto(db, usuario, presupuestoId);
      if (presupuesto.estado !== "borrador" || !permisosPresupuesto(usuario, presupuesto.creadoPor).modificar) {
        throw new ErrorArchivoCotizacion("Este presupuesto no se puede modificar.");
      }
      if (presupuesto.partidas.length === 0) {
        throw new ErrorArchivoCotizacion("Agrega una partida al presupuesto antes de subir la cotización.");
      }
      categorias = presupuesto.partidas.map(({ id, nombre }) => ({ id, nombre }));
    } catch (error) {
      if (error instanceof ErrorArchivoCotizacion) throw error;
      if (error instanceof ErrorNegocio) throw new ErrorArchivoCotizacion(error.message);
      throw error;
    }
  }
  if (!extraccionDisponible()) {
    return {
      ...base,
      aviso: "El archivo se adjuntó, pero la lectura automática no está configurada. Ingresa los ítems a mano.",
    };
  }

  try {
    const [buffer, catalogo] = await Promise.all([
      leerArchivo(registro.nombreGuardado, registro.almacenamiento),
      listarEquipos(db),
    ]);
    const datos = await extraerCotizacion(buffer, registro.mime, registro.nombreOriginal, categorias);
    const nombrePartidaPorId = new Map(categorias?.map((categoria) => [categoria.id, categoria.nombre]));
    const borrador: BorradorAlternativa = {
      proveedor: datos.proveedor,
      tipoCompra: datos.tipoCompra,
      items: datos.items.map((it) => {
        const item = it as typeof it & { partidaId?: string };
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
          ...(item.partidaId ? { partidaId: item.partidaId, partidaNombre: nombrePartidaPorId.get(item.partidaId) } : {}),
        };
      }),
    };
    return { ...base, borrador };
  } catch (error) {
    const mensaje = error instanceof ErrorExtraccion ? error.message : "Error inesperado al leer la cotización.";
    if (!(error instanceof ErrorExtraccion)) console.error(error);
    // El mensaje del PDF escaneado ya explica qué hacer; no se le agrega el texto genérico.
    if (error instanceof ErrorPdfEscaneado) return { ...base, aviso: mensaje };
    return { ...base, aviso: `${mensaje} El archivo quedó adjunto; puedes ingresar los ítems a mano.` };
  }
}
