import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { requerirUsuario } from "@/lib/sesion";
import { ErrorNegocio, obtenerAlternativa } from "@/lib/datos";
import { listarEquipos } from "@/lib/catalogo";
import { EditorAlternativa } from "../EditorAlternativa";

export default async function EditarAlternativa({ params }: { params: Promise<{ id: string; altId: string }> }) {
  const usuario = await requerirUsuario();
  const { id, altId } = await params;

  let datos;
  try {
    datos = await obtenerAlternativa(db, usuario, altId);
  } catch (e) {
    if (e instanceof ErrorNegocio) notFound();
    throw e;
  }
  const { alternativa, partida, presupuesto, items, archivo } = datos;
  if (presupuesto.id !== id) notFound();
  if (presupuesto.estado !== "borrador") redirect(`/presupuestos/${id}`);

  const catalogo = (await listarEquipos(db)).map(({ id, nombre, marca, modelo }) => ({ id, nombre, marca, modelo }));

  return (
    <>
      <Link href={`/presupuestos/${id}#partida-${partida.id}`} className="btn-texto -ml-1.5 mb-2">
        Volver a {presupuesto.nombre}
      </Link>
      <h1 className="titulo-pagina">Editar alternativa</h1>
      <p className="ayuda mb-6">Partida: {partida.nombre}</p>
      <EditorAlternativa
        presupuestoId={id}
        partida={{ id: partida.id, nombre: partida.nombre }}
        catalogo={catalogo}
        iniciales={{
          id: alternativa.id,
          proveedor: alternativa.proveedor,
          tipoCompra: alternativa.tipoCompra,
          notas: alternativa.notas,
          archivo: archivo ? { id: archivo.id, nombre: archivo.nombreOriginal } : null,
          items: items.map((it) => ({
            equipoId: it.equipoId,
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precioUnitarioCentavos: it.precioUnitarioCentavos,
            moneda: it.moneda,
          })),
        }}
      />
    </>
  );
}
