import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { requerirUsuario } from "@/lib/sesion";
import { ErrorNegocio, obtenerPresupuesto, permisosPresupuesto } from "@/lib/datos";
import { listarEquipos } from "@/lib/catalogo";
import { EditorAlternativa } from "../EditorAlternativa";

export default async function NuevaAlternativa({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ partida?: string }>;
}) {
  const usuario = await requerirUsuario();
  const { id } = await params;
  const { partida: partidaId } = await searchParams;

  let p;
  try {
    p = await obtenerPresupuesto(db, usuario, id);
  } catch (e) {
    if (e instanceof ErrorNegocio) notFound();
    throw e;
  }
  if (p.estado !== "borrador" || !permisosPresupuesto(usuario, p.creadoPor).modificar) redirect(`/presupuestos/${id}`);
  const partida = p.partidas.find((x) => x.id === partidaId);
  if (!partida) notFound();

  const catalogo = (await listarEquipos(db)).map(({ id, nombre, marca, modelo }) => ({ id, nombre, marca, modelo }));

  return (
    <>
      <Link href={`/presupuestos/${id}#partida-${partida.id}`} className="btn-secundario mb-4">
        Volver a {p.nombre}
      </Link>
      <h1 className="titulo-pagina">Nueva alternativa</h1>
      <p className="ayuda mb-6">Partida: {partida.nombre}</p>
      <EditorAlternativa
        presupuestoId={id}
        partida={{ id: partida.id, nombre: partida.nombre }}
        catalogo={catalogo}
      usuarioId={usuario.id}
        usarUploadThingDropzone={process.env.ARCHIVOS_STORAGE === "uploadthing"}
      usarSubidaDirectaBlob={process.env.ARCHIVOS_STORAGE === "blob" || (!process.env.ARCHIVOS_STORAGE && Boolean(process.env.VERCEL))}
      />
    </>
  );
}
