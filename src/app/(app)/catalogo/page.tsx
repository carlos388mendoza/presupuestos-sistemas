import Link from "next/link";
import { db } from "@/db";
import { requerirUsuario } from "@/lib/sesion";
import { contarPendientes, listarEquipos } from "@/lib/catalogo";
import { actualizarEquipo, aprobarEquipo, crearEquipo, eliminarEquipo, fusionarEquipo } from "@/actions/catalogo";
import { FormAccion } from "@/components/FormAccion";
import { Etiqueta } from "@/components/Etiqueta";
import { ModalFormulario } from "@/components/ModalFormulario";
import { ComboboxEquipo } from "@/components/campos";

type Equipo = Awaited<ReturnType<typeof listarEquipos>>[number];

function CamposEquipo({ e, prefijo }: { e?: Equipo; prefijo: string }) {
  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="etiqueta" htmlFor={`${prefijo}-nombre`}>Nombre</label>
        <input id={`${prefijo}-nombre`} name="nombre" required maxLength={200} defaultValue={e?.nombre} className="campo" />
      </div>
      <div>
        <label className="etiqueta" htmlFor={`${prefijo}-marca`}>Marca</label>
        <input id={`${prefijo}-marca`} name="marca" maxLength={120} defaultValue={e?.marca} className="campo" />
      </div>
      <div>
        <label className="etiqueta" htmlFor={`${prefijo}-modelo`}>Modelo</label>
        <input id={`${prefijo}-modelo`} name="modelo" maxLength={120} defaultValue={e?.modelo} className="campo" />
      </div>
      <div>
        <label className="etiqueta" htmlFor={`${prefijo}-categoria`}>Categoría</label>
        <input id={`${prefijo}-categoria`} name="categoria" maxLength={80} defaultValue={e?.categoria} className="campo"
          placeholder="Ej. Redes" list="categorias" />
      </div>
      <div>
        <label className="etiqueta" htmlFor={`${prefijo}-descripcion`}>Descripción</label>
        <input id={`${prefijo}-descripcion`} name="descripcion" maxLength={1000} defaultValue={e?.descripcion} className="campo" />
      </div>
    </div>
  );
}

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
          <form className="mb-4 flex flex-wrap items-center gap-3" role="search">
            <label htmlFor="q" className="sr-only">Buscar</label>
            <input id="q" name="q" defaultValue={q} placeholder="Buscar por nombre, marca, modelo o categoría" className="campo max-w-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="pendientes" value="1" defaultChecked={soloPendientes} />
              Solo por revisar ({totalPendientes})
            </label>
            <button className="btn-secundario">Filtrar</button>
            {(q || soloPendientes) && <Link href="/catalogo" className="btn-texto">Limpiar</Link>}
          </form>

          {equipos.length === 0 ? (
            <div className="panel p-6 text-sm text-suave">
              {q || soloPendientes ? "Ningún equipo coincide con el filtro." : "El catálogo está vacío. Agrega el primer equipo."}
            </div>
          ) : (
            <ul className="panel divide-y divide-linea-2">
              {equipos.map((e) => (
                <li key={e.id} className={e.revisado ? "" : "bg-aviso-claro/40"}>
                  <details>
                    <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                      <span className="font-medium">{e.nombre}</span>
                      <span className="text-sm text-suave">{[e.marca, e.modelo].filter(Boolean).join(" · ")}</span>
                      <span className="ml-auto flex items-center gap-2">
                        {e.categoria && <span className="text-xs text-suave">{e.categoria}</span>}
                        {!e.revisado && <Etiqueta tipo="nuevo">Por revisar</Etiqueta>}
                      </span>
                    </summary>
                    <div className="space-y-4 border-t border-linea-2 bg-papel px-4 py-4">
                      <FormAccion action={actualizarEquipo} className="formulario">
                        <input type="hidden" name="id" value={e.id} />
                        {!e.revisado && <input type="hidden" name="aprobar" value="1" />}
                        <CamposEquipo e={e} prefijo={e.id} />
                        <button className="btn-secundario self-start">{e.revisado ? "Guardar" : "Guardar y marcar como revisado"}</button>
                      </FormAccion>
                      {!e.revisado && (
                        <FormAccion action={aprobarEquipo} enLinea className="flex items-center">
                          <input type="hidden" name="id" value={e.id} />
                          <button className="btn-texto px-0">Está bien así, marcar como revisado</button>
                        </FormAccion>
                      )}
                      <FormAccion action={fusionarEquipo} className="flex flex-wrap items-end gap-2 border-t border-linea-2 pt-4"
                        confirmar="Las cotizaciones que usan este equipo pasarán al equipo elegido, y este se eliminará. ¿Continuar?">
                        <input type="hidden" name="id" value={e.id} />
                        <div className="min-w-56 flex-1">
                          <label className="etiqueta" htmlFor={`f-${e.id}`}>Es un duplicado de</label>
                          <ComboboxEquipo
                            catalogo={todos.filter((o) => o.id !== e.id).map(({ id, nombre, marca, modelo }) => ({ id, nombre, marca, modelo }))}
                            name="destinoId"
                            defaultValue=""
                            ariaLabel="Equipo destino para fusionar"
                          />
                        </div>
                        <button className="btn-secundario">Fusionar</button>
                      </FormAccion>
                      <FormAccion action={eliminarEquipo} confirmar={`¿Eliminar "${e.nombre}" del catálogo? Las cotizaciones conservan la descripción.`}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="btn-peligro px-0">Eliminar del catálogo</button>
                      </FormAccion>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="panel h-fit p-5 lg:sticky lg:top-8">
          <ModalFormulario titulo="Agregar equipo">
            <FormAccion action={crearEquipo} limpiarAlTerminar className="formulario">
              <CamposEquipo prefijo="nuevo" />
              <button className="btn-primario w-full">Agregar al catálogo</button>
            </FormAccion>
          </ModalFormulario>
        </aside>
      </div>
    </>
  );
}
