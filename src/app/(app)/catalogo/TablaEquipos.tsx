"use client";

import { Fragment, useMemo, useState } from "react";
import { actuarEquiposEnLote, actualizarEquipo, aprobarEquipo, eliminarEquipo, fusionarEquipo } from "@/actions/catalogo";
import { FormAccion } from "@/components/FormAccion";
import { Etiqueta } from "@/components/Etiqueta";
import { ComboboxEquipo } from "@/components/campos";

type Equipo = {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  descripcion: string;
  categoria: string;
  origen: "manual" | "ia";
  revisado: boolean;
};

function CamposEquipo({ e, prefijo }: { e: Equipo; prefijo: string }) {
  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className="etiqueta" htmlFor={`${prefijo}-nombre`}>Nombre</label><input id={`${prefijo}-nombre`} name="nombre" required maxLength={200} defaultValue={e.nombre} className="campo" /></div>
      <div><label className="etiqueta" htmlFor={`${prefijo}-marca`}>Marca</label><input id={`${prefijo}-marca`} name="marca" maxLength={120} defaultValue={e.marca} className="campo" /></div>
      <div><label className="etiqueta" htmlFor={`${prefijo}-modelo`}>Modelo</label><input id={`${prefijo}-modelo`} name="modelo" maxLength={120} defaultValue={e.modelo} className="campo" /></div>
      <div><label className="etiqueta" htmlFor={`${prefijo}-categoria`}>Categoría</label><input id={`${prefijo}-categoria`} name="categoria" maxLength={80} defaultValue={e.categoria} className="campo" placeholder="Ej. Redes" list="categorias" /></div>
      <div><label className="etiqueta" htmlFor={`${prefijo}-descripcion`}>Descripción</label><input id={`${prefijo}-descripcion`} name="descripcion" maxLength={1000} defaultValue={e.descripcion} className="campo" /></div>
    </div>
  );
}

function DetallesEquipo({ e, todos }: { e: Equipo; todos: Equipo[] }) {
  return <div className="space-y-4 border-t border-linea-2 bg-papel px-4 py-4">
    <FormAccion action={actualizarEquipo} className="formulario"><input type="hidden" name="id" value={e.id} />{!e.revisado && <input type="hidden" name="aprobar" value="1" />}<CamposEquipo e={e} prefijo={e.id} /><button className="btn-secundario self-start">{e.revisado ? "Guardar" : "Guardar y marcar como revisado"}</button></FormAccion>
    {!e.revisado && <FormAccion action={aprobarEquipo} enLinea className="flex items-center"><input type="hidden" name="id" value={e.id} /><button className="btn-texto px-0">Está bien así, marcar como revisado</button></FormAccion>}
    <FormAccion action={fusionarEquipo} className="flex flex-wrap items-end gap-2 border-t border-linea-2 pt-4" confirmar="Las cotizaciones que usan este equipo pasarán al equipo elegido, y este se eliminará. ¿Continuar?"><input type="hidden" name="id" value={e.id} /><div className="min-w-0 flex-1"><label className="etiqueta" htmlFor={`f-${e.id}`}>Es un duplicado de</label><ComboboxEquipo catalogo={todos.filter((o) => o.id !== e.id).map(({ id, nombre, marca, modelo }) => ({ id, nombre, marca, modelo }))} name="destinoId" defaultValue="" ariaLabel="Equipo destino para fusionar" /></div><button className="btn-secundario">Fusionar</button></FormAccion>
    <FormAccion action={eliminarEquipo} confirmar={`¿Eliminar "${e.nombre}" del catálogo? Las cotizaciones conservan la descripción.`}><input type="hidden" name="id" value={e.id} /><button className="btn-peligro px-0">Eliminar del catálogo</button></FormAccion>
  </div>;
}

export function TablaEquipos({ equipos, todos }: { equipos: Equipo[]; todos: Equipo[] }) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [orden, setOrden] = useState<{ campo: "nombre" | "marca" | "modelo" | "categoria"; asc: boolean }>({ campo: "nombre", asc: true });
  const ordenados = useMemo(() => [...equipos].sort((a, b) => {
    const n = a[orden.campo].localeCompare(b[orden.campo], "es", { sensitivity: "base" });
    return orden.asc ? n : -n;
  }), [equipos, orden]);
  const todosVisiblesSeleccionados = equipos.length > 0 && equipos.every((e) => seleccionados.includes(e.id));
  const cambiarOrden = (campo: typeof orden.campo) => setOrden((actual) => ({ campo, asc: actual.campo === campo ? !actual.asc : true }));
  const alternarSeleccion = (id: string) => setSeleccionados((actual) => actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]);

  if (!equipos.length) return <div className="panel p-6 text-sm text-suave">El catálogo no contiene equipos que coincidan con el filtro.</div>;

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-linea-2 bg-fondo px-4 py-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" aria-label="Seleccionar todos los equipos visibles" checked={todosVisiblesSeleccionados} onChange={() => setSeleccionados(todosVisiblesSeleccionados ? seleccionados.filter((id) => !equipos.some((e) => e.id === id)) : [...new Set([...seleccionados, ...equipos.map((e) => e.id)])])} />
          {seleccionados.length} seleccionados
        </label>
        {seleccionados.length > 0 && <>
          <FormAccion action={actuarEquiposEnLote} enLinea className="flex items-center gap-2">
            {seleccionados.map((id) => <input key={id} type="hidden" name="id" value={id} />)}
            <input type="hidden" name="operacion" value="aprobar" />
            <button className="btn-secundario">Marcar revisados</button>
          </FormAccion>
          <FormAccion action={actuarEquiposEnLote} enLinea className="flex items-center gap-2" confirmar={`Se eliminarán ${seleccionados.length} equipos del catálogo. Las cotizaciones conservarán sus descripciones. ¿Continuar?`}>
            {seleccionados.map((id) => <input key={id} type="hidden" name="id" value={id} />)}
            <input type="hidden" name="operacion" value="eliminar" />
            <button className="btn-peligro">Eliminar seleccionados</button>
          </FormAccion>
        </>}
      </div>
      <div className="divide-y divide-linea-2 xl:hidden">
        {ordenados.map((e) => <article key={e.id} className={`min-w-0 p-4 ${!e.revisado ? "bg-aviso-claro/30" : ""}`}>
          <div className="flex min-w-0 items-start gap-3">
            <input type="checkbox" aria-label={`Seleccionar ${e.nombre}`} checked={seleccionados.includes(e.id)} onChange={() => alternarSeleccion(e.id)} className="mt-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words font-medium">{e.nombre}</h3>{e.revisado ? <span className="text-xs text-suave">Revisado</span> : <Etiqueta tipo="nuevo">Por revisar</Etiqueta>}</div>
              <p className="mt-1 break-words text-sm text-suave">{[e.marca, e.modelo].filter(Boolean).join(" · ") || "Sin marca ni modelo"}</p>
              {e.categoria && <p className="mt-1 break-words text-xs text-suave">{e.categoria}</p>}
            </div>
            <button type="button" className="btn-texto shrink-0" aria-expanded={abierto === e.id} onClick={() => setAbierto(abierto === e.id ? null : e.id)}>{abierto === e.id ? "Cerrar" : "Editar"}</button>
          </div>
          {abierto === e.id && <div className="mt-3"><DetallesEquipo e={e} todos={todos} /></div>}
        </article>)}
      </div>
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-fondo text-suave"><tr>
            <th className="w-10 px-3 py-3"><span className="sr-only">Seleccionar</span></th>
            {([ ["nombre", "Nombre"], ["marca", "Marca"], ["modelo", "Modelo"], ["categoria", "Categoría"] ] as const).map(([campo, titulo]) => <th key={campo} className="px-3 py-3 font-medium"><button type="button" className="inline-flex items-center gap-1 hover:text-texto" onClick={() => cambiarOrden(campo)}>{titulo}<span aria-hidden="true">{orden.campo === campo ? (orden.asc ? "↑" : "↓") : "↕"}</span></button></th>)}
            <th className="px-3 py-3 font-medium">Estado</th><th className="px-3 py-3 text-right font-medium">Acciones</th>
          </tr></thead>
          <tbody className="divide-y divide-linea-2">
            {ordenados.map((e) => <Fragment key={e.id}>
              <tr className={!e.revisado ? "bg-aviso-claro/30" : ""}>
                <td className="px-3 py-3"><input type="checkbox" aria-label={`Seleccionar ${e.nombre}`} checked={seleccionados.includes(e.id)} onChange={() => alternarSeleccion(e.id)} /></td>
                <td className="px-3 py-3 font-medium">{e.nombre}</td><td className="px-3 py-3">{e.marca || "—"}</td><td className="px-3 py-3">{e.modelo || "—"}</td><td className="px-3 py-3">{e.categoria || "—"}</td>
                <td className="px-3 py-3">{e.revisado ? <span className="text-suave">Revisado</span> : <Etiqueta tipo="nuevo">Por revisar</Etiqueta>}</td>
                <td className="px-3 py-3 text-right"><button type="button" className="btn-texto" aria-expanded={abierto === e.id} onClick={() => setAbierto(abierto === e.id ? null : e.id)}>{abierto === e.id ? "Cerrar" : "Editar"}</button></td>
              </tr>
              {abierto === e.id && <tr key={`${e.id}-details`}><td colSpan={7} className="border-t border-linea-2 bg-papel"><DetallesEquipo e={e} todos={todos} /></td></tr>}
            </Fragment>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
