import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { ErrorNegocio, obtenerPresupuesto, permisosPresupuesto } from "@/lib/datos";
import { requerirUsuario } from "@/lib/sesion";
import { SubirCotizacionPresupuesto } from "./SubirCotizacionPresupuesto";

export default async function NuevaCotizacionPresupuesto({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  let presupuesto: Awaited<ReturnType<typeof obtenerPresupuesto>>;
  try {
    presupuesto = await obtenerPresupuesto(db, usuario, id);
  } catch (error) {
    if (error instanceof ErrorNegocio) notFound();
    throw error;
  }
  if (presupuesto.estado !== "borrador" || !permisosPresupuesto(usuario, presupuesto.creadoPor).modificar) notFound();
  if (presupuesto.partidas.length === 0) notFound();
  return (
    <>
      <Link href={`/presupuestos/${presupuesto.id}`} className="btn-secundario mb-4">Volver al presupuesto</Link>
      <h1 className="titulo-pagina mb-2">Subir cotización</h1>
      <p className="ayuda mb-6">La IA leerá los productos y los sugerirá en las partidas de “{presupuesto.nombre}”. Revisa todo antes de guardar.</p>
      <SubirCotizacionPresupuesto
        presupuestoId={presupuesto.id}
        partidas={presupuesto.partidas.map(({ id: partidaId, nombre }) => ({ id: partidaId, nombre }))}
      />
    </>
  );
}
