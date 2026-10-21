import { eq } from "drizzle-orm";
import { db } from "@/db";
import { archivos } from "@/db/schema";
import { obtenerUsuario } from "@/lib/sesion";
import { puedeVerArchivo } from "@/lib/datos";
import { leerDeDisco } from "@/lib/archivos";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuario();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  const { id } = await params;
  if (!await puedeVerArchivo(db, usuario, id)) return new Response("No encontrado", { status: 404 });

  const [a] = await db.select().from(archivos).where(eq(archivos.id, id));
  try {
    const contenido = await leerDeDisco(a.nombreGuardado);
    return new Response(new Uint8Array(contenido), {
      headers: {
        "Content-Type": a.mime,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(a.nombreOriginal)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("El archivo ya no existe en el servidor.", { status: 410 });
  }
}
