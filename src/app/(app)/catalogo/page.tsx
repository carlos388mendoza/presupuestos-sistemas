import { db } from "@/db";
import { requerirUsuario } from "@/lib/sesion";
import { contarPendientes, listarEquipos } from "@/lib/catalogo";
import { crearEquipo } from "@/actions/catalogo";
import { FormAccion } from "@/components/FormAccion";
import { ModalFormulario } from "@/components/ModalFormulario";
import { FiltrosCatalogo } from "./FiltrosCatalogo";
import { TablaEquipos } from "./TablaEquipos";

export default async function PaginaCatalogo({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pendientes?: string }>;
}) {
  await requerirUsuario();
  const { q = "", pendientes } = await searchParams;
  const soloPendientes = pendientes === "1";
  const equipos = await listarEquipos(db, { q: q.trim() || undefined, soloPendientes });
  const todos = await listarEquipos(db);
  const totalPendientes = await contarPendientes(db);
  const categorias = [...new Set(todos.map((e) => e.categoria).filter(Boolean))].sort();

  return (
    <>
      <div className="mb-6">
        <h1 className="titulo-pagina">Catálogo de equipos</h1>
        <p className="ayuda max-w-prose">
          Los equipos que se usan en las cotizaciones. Cuando una cotización trae un equipo que no está aquí, se agrega
          solo y queda marcado para revisar.
        </p>
      </div>

      <datalist id="categorias">
        {categorias.map((c) => <option key={c} value={c} />)}
      </datalist>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <FiltrosCatalogo
            key={`${q}|${soloPendientes}`}
            busquedaInicial={q}
            soloPendientesInicial={soloPendientes}
            totalPendientes={totalPendientes}
          />

          {equipos.length === 0 ? (
            <div className="panel p-6 text-sm text-suave">
              {q || soloPendientes ? "Ningún equipo coincide con el filtro." : "El catálogo está vacío. Agrega el primer equipo."}
            </div>
          ) : <TablaEquipos equipos={equipos} todos={todos} />}
        </div>

        <aside className="panel h-fit p-5 lg:sticky lg:top-8">
          <ModalFormulario titulo="Agregar equipo">
            <FormAccion action={crearEquipo} limpiarAlTerminar className="formulario">
              <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className="etiqueta" htmlFor="nuevo-nombre">Nombre</label><input id="nuevo-nombre" name="nombre" required maxLength={200} className="campo" /></div>
                <div><label className="etiqueta" htmlFor="nuevo-marca">Marca</label><input id="nuevo-marca" name="marca" maxLength={120} className="campo" /></div>
                <div><label className="etiqueta" htmlFor="nuevo-modelo">Modelo</label><input id="nuevo-modelo" name="modelo" maxLength={120} className="campo" /></div>
                <div><label className="etiqueta" htmlFor="nuevo-categoria">Categoría</label><input id="nuevo-categoria" name="categoria" maxLength={80} className="campo" placeholder="Ej. Redes" list="categorias" /></div>
                <div><label className="etiqueta" htmlFor="nuevo-descripcion">Descripción</label><input id="nuevo-descripcion" name="descripcion" maxLength={1000} className="campo" /></div>
              </div>
              <button className="btn-primario w-full">Agregar al catálogo</button>
            </FormAccion>
          </ModalFormulario>
        </aside>
      </div>
    </>
  );
}
