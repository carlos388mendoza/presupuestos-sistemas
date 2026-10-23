import { eq } from "drizzle-orm";
import { head } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { archivos } from "@/db/schema";
import { borrarArchivo, TIPOS_PERMITIDOS } from "@/lib/archivos";
import { puedeCrearPresupuestos } from "@/lib/datos";
import { TAMANO_MAXIMO_ARCHIVO } from "@/lib/limites";
import { registrarCotizacion } from "@/lib/procesar-cotizacion";
import { obtenerUsuario } from "@/lib/sesion";

export async function POST(request: Request) {
  const usuario = await obtenerUsuario();
  if (!usuario) return NextResponse.json({ error: "Tu sesión expiró." }, { status: 401 });

  let body: { pathname?: unknown; nombreOriginal?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud no es válida." }, { status: 400 });
  }

  const pathname = body.pathname;
  const nombreOriginal = body.nombreOriginal;
  const prefijo = `cotizaciones/${usuario.id}/`;
  if (
    !puedeCrearPresupuestos(usuario) ||
    typeof pathname !== "string" ||
    !pathname.startsWith(prefijo) ||
    !/^[0-9a-f-]{36}\.(pdf|jpg|png|webp|xlsx|docx)$/i.test(pathname.slice(prefijo.length)) ||
    typeof nombreOriginal !== "string" ||
    !nombreOriginal.trim() ||
    nombreOriginal.length > 255
  ) {
    return NextResponse.json({ error: "El archivo no es válido o no tienes permiso para subirlo." }, { status: 400 });
  }

  const [existente] = await db.select().from(archivos).where(eq(archivos.nombreGuardado, pathname)).limit(1);
  if (existente) {
    if (existente.subidoPor !== usuario.id) return NextResponse.json({ error: "No tienes acceso a este archivo." }, { status: 404 });
    return NextResponse.json({ archivoId: existente.id, archivoNombre: existente.nombreOriginal });
  }

  let blob;
  try {
    blob = await head(pathname);
  } catch {
    blob = null;
  }
  if (
    !blob ||
    !TIPOS_PERMITIDOS[blob.contentType] ||
    !pathname.endsWith(`.${TIPOS_PERMITIDOS[blob.contentType]}`) ||
    blob.size > TAMANO_MAXIMO_ARCHIVO
  ) {
    return NextResponse.json({ error: "No se encontró el archivo subido o su formato no está permitido." }, { status: 400 });
  }

  try {
    return NextResponse.json(await registrarCotizacion(
      usuario,
      { nombre: nombreOriginal.trim(), mime: blob.contentType, tamano: blob.size },
      { nombreGuardado: pathname, almacenamiento: "blob" },
    ));
  } catch (error) {
    const [registroConcurrente] = await db.select().from(archivos).where(eq(archivos.nombreGuardado, pathname)).limit(1);
    if (registroConcurrente?.subidoPor === usuario.id) {
      return NextResponse.json({ archivoId: registroConcurrente.id, archivoNombre: registroConcurrente.nombreOriginal });
    }
    await borrarArchivo(pathname, "blob").catch((errorAlBorrar) => console.error("No se pudo limpiar la carga de Blob.", errorAlBorrar));
    throw error;
  }
}
