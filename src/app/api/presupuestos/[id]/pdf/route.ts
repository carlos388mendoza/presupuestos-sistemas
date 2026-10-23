import { db } from "@/db";
import { obtenerUsuario } from "@/lib/sesion";
import { ErrorNegocio, obtenerPresupuesto } from "@/lib/datos";
import { generarPdf, nombreArchivoPdf } from "@/lib/pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuario();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  const { id } = await params;

  let presupuesto;
  try {
    presupuesto = await obtenerPresupuesto(db, usuario, id);
  } catch (error) {
    if (error instanceof ErrorNegocio) return new Response(error.message, { status: 404 });
    throw error;
  }
  if (presupuesto.estado !== "listo") {
    return new Response("Marca el presupuesto como listo antes de descargarlo.", { status: 409 });
  }

  const buffer = await generarPdf(presupuesto);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nombreArchivoPdf(presupuesto))}`,
      "Cache-Control": "no-store",
    },
  });
}
