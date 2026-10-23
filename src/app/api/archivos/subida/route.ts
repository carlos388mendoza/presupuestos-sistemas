import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { TIPOS_PERMITIDOS } from "@/lib/archivos";
import { puedeCrearPresupuestos } from "@/lib/datos";
import { TAMANO_MAXIMO_ARCHIVO } from "@/lib/limites";
import { obtenerUsuario } from "@/lib/sesion";

const TIPOS_MIME = Object.keys(TIPOS_PERMITIDOS);

export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "La solicitud de subida no es válida." }, { status: 400 });
  }

  try {
    const resultado = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const usuario = await obtenerUsuario();
        if (!usuario) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
        if (!puedeCrearPresupuestos(usuario)) throw new Error("Tu rol no permite subir cotizaciones.");
        const usaBlob = process.env.ARCHIVOS_STORAGE === "blob" || (!process.env.ARCHIVOS_STORAGE && Boolean(process.env.VERCEL));
        if (!usaBlob) throw new Error("La subida directa requiere almacenamiento Vercel Blob.");

        const prefijo = `cotizaciones/${usuario.id}/`;
        const nombre = pathname.startsWith(prefijo) ? pathname.slice(prefijo.length) : "";
        if (!/^[0-9a-f-]{36}\.(pdf|jpg|png|webp|xlsx|docx)$/i.test(nombre)) {
          throw new Error("La ruta del archivo no es válida.");
        }

        return {
          allowedContentTypes: TIPOS_MIME,
          maximumSizeInBytes: TAMANO_MAXIMO_ARCHIVO,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
    });
    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo autorizar la subida." },
      { status: 400 },
    );
  }
}
