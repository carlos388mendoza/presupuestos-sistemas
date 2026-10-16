import { db } from "@/db";
import { obtenerUsuario } from "@/lib/sesion";
import { ErrorNegocio, obtenerPresupuesto } from "@/lib/datos";
import { generarExcel, nombreArchivoExcel } from "@/lib/excel";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuario();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  const { id } = await params;

  let p;
  try {
    p = await obtenerPresupuesto(db, usuario, id);
  } catch (e) {
    if (e instanceof ErrorNegocio) return new Response(e.message, { status: 404 });
    throw e;
  }
  if (p.estado !== "listo") {
    return new Response("Marca el presupuesto como listo antes de descargarlo.", { status: 409 });
  }

  const buffer = await generarExcel(p);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nombreArchivoExcel(p))}`,
      "Cache-Control": "no-store",
    },
  });
}
