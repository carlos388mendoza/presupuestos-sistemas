"use client";

import { useMemo, useState } from "react";
import { cambiarActivo, cambiarRol, restablecerContrasena } from "@/actions/usuarios";
import { FormAccion } from "@/components/FormAccion";
import { NOMBRES_ROL } from "@/lib/datos";

type Usuario = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "creador" | "aprobador";
  activo: boolean;
};

type Filtro = "todos" | "activos" | "inactivos";

function AccionesUsuario({ usuario }: { usuario: Usuario }) {
  return (
    <details className="relative">
      <summary aria-label={`Acciones de ${usuario.name}`} className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md text-suave hover:bg-fondo hover:text-tinta focus-visible:outline-2 focus-visible:outline-hnl [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>
        </svg>
      </summary>
      <div className="absolute right-0 top-full z-30 mt-1 w-72 rounded-lg border border-linea bg-papel p-3 text-left shadow-xl">
        <FormAccion action={cambiarRol} enLinea className="flex items-end gap-2">
          <input type="hidden" name="id" value={usuario.id}/>
          <div className="min-w-0 flex-1">
            <label className="etiqueta" htmlFor={`role-${usuario.id}`}>Rol</label>
            <select id={`role-${usuario.id}`} name="role" defaultValue={usuario.role} className="campo py-2">
              <option value="creador">{NOMBRES_ROL.creador}</option>
              <option value="aprobador">{NOMBRES_ROL.aprobador}</option>
              <option value="admin">{NOMBRES_ROL.admin}</option>
            </select>
          </div>
          <button className="btn-secundario shrink-0">Guardar</button>
        </FormAccion>
        <FormAccion
          action={cambiarActivo}
          enLinea
          className="mt-2"
          confirmar={usuario.activo ? `¿Desactivar a ${usuario.name}? Se cerrarán sus sesiones.` : undefined}
        >
          <input type="hidden" name="id" value={usuario.id}/>
          <input type="hidden" name="activo" value={usuario.activo ? "0" : "1"}/>
          <button className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-fondo ${usuario.activo ? "text-peligro" : "text-hnl"}`}>
            {usuario.activo ? "Desactivar cuenta" : "Activar cuenta"}
          </button>
        </FormAccion>
        <details className="mt-1 border-t border-linea-2 pt-2">
          <summary className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-tinta-2 hover:bg-fondo">Cambiar contraseña</summary>
          <FormAccion action={restablecerContrasena} limpiarAlTerminar className="mt-2 space-y-2 px-1">
            <input type="hidden" name="id" value={usuario.id}/>
            <label className="sr-only" htmlFor={`password-${usuario.id}`}>Nueva contraseña para {usuario.name}</label>
            <input id={`password-${usuario.id}`} name="password" type="text" minLength={8} required autoComplete="off" placeholder="Nueva contraseña" className="campo"/>
            <button className="btn-secundario w-full">Guardar contraseña</button>
          </FormAccion>
        </details>
      </div>
    </details>
  );
}

function IdentidadUsuario({ usuario, actualId }: { usuario: Usuario; actualId: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-hnl-claro text-sm font-semibold text-hnl">
        {usuario.name.trim().slice(0, 1).toLocaleUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-tinta">
          {usuario.name}{usuario.id === actualId && <span className="ml-1.5 text-xs font-normal text-suave">Tú</span>}
        </span>
        <span className="block truncate text-sm text-suave">{usuario.email}</span>
      </span>
    </div>
  );
}

export function ListaUsuarios({ usuarios, actualId }: { usuarios: Usuario[]; actualId: string }) {
  const [buscar, setBuscar] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const activos = usuarios.filter((u) => u.activo).length;
  const inactivos = usuarios.length - activos;
  const visibles = useMemo(() => {
    const q = buscar.trim().toLocaleLowerCase();
    return usuarios.filter((u) => {
      const coincideTexto = !q || u.name.toLocaleLowerCase().includes(q) || u.email.toLocaleLowerCase().includes(q);
      const coincideEstado = filtro === "todos" || (filtro === "activos" ? u.activo : !u.activo);
      return coincideTexto && coincideEstado;
    });
  }, [usuarios, buscar, filtro]);

  const tabs: { valor: Filtro; texto: string; cuenta: number }[] = [
    { valor: "todos", texto: "Todos", cuenta: usuarios.length },
    { valor: "activos", texto: "Activos", cuenta: activos },
    { valor: "inactivos", texto: "Inactivos", cuenta: inactivos },
  ];

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-linea-2 p-4 sm:flex-row sm:items-center sm:p-5">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar usuarios por nombre o correo</span>
          <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-suave" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>
          </svg>
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre o correo…" className="campo pl-10"/>
        </label>
        <div role="group" aria-label="Filtrar usuarios por estado" className="flex flex-wrap items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.valor}
              type="button"
              aria-pressed={filtro === tab.valor}
              onClick={() => setFiltro(tab.valor)}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${filtro === tab.valor ? "bg-hnl-claro font-semibold text-hnl" : "text-tinta-2 hover:bg-fondo"}`}
            >
              {tab.texto} <span className="ml-1 tabular-nums">{tab.cuenta}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hidden xl:block">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup><col className="w-[34%]"/><col className="w-[31%]"/><col className="w-[18%]"/><col className="w-[12%]"/><col className="w-[5%]"/></colgroup>
          <thead className="bg-fondo text-suave">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Usuario</th>
              <th scope="col" className="px-4 py-3 font-medium">Correo</th>
              <th scope="col" className="px-4 py-3 font-medium">Rol</th>
              <th scope="col" className="px-4 py-3 font-medium">Estado</th>
              <th scope="col" className="px-3 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linea-2">
            {visibles.map((usuario) => (
              <tr key={usuario.id} className={`h-[76px] transition-colors hover:bg-fondo/70 ${usuario.activo ? "" : "opacity-65"}`}>
                <td className="px-5 py-3"><IdentidadUsuario usuario={usuario} actualId={actualId}/></td>
                <td className="px-4 py-3"><span className="block truncate text-tinta-2" title={usuario.email}>{usuario.email}</span></td>
                <td className="px-4 py-3"><span className="inline-flex max-w-full truncate rounded-full border border-linea-2 bg-papel px-2.5 py-1 text-xs font-medium text-tinta-2">{NOMBRES_ROL[usuario.role]}</span></td>
                <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${usuario.activo ? "bg-hnl-claro text-hnl" : "bg-fondo text-suave"}`}>{usuario.activo ? "Activo" : "Inactivo"}</span></td>
                <td className="px-3 py-3 text-right"><AccionesUsuario usuario={usuario}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-linea-2 xl:hidden">
        {visibles.map((usuario) => (
          <li key={usuario.id} className={`flex min-w-0 items-center justify-between gap-3 px-4 py-4 ${usuario.activo ? "" : "opacity-65"}`}>
            <div className="min-w-0 flex-1">
              <IdentidadUsuario usuario={usuario} actualId={actualId}/>
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-[52px]">
                <span className="inline-flex max-w-full truncate rounded-full border border-linea-2 bg-papel px-2.5 py-1 text-xs font-medium text-tinta-2">{NOMBRES_ROL[usuario.role]}</span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${usuario.activo ? "bg-hnl-claro text-hnl" : "bg-fondo text-suave"}`}>{usuario.activo ? "Activo" : "Inactivo"}</span>
              </div>
            </div>
            <AccionesUsuario usuario={usuario}/>
          </li>
        ))}
      </ul>

      {visibles.length === 0 && <p className="px-5 py-12 text-center text-sm text-suave">No hay usuarios que coincidan con la búsqueda.</p>}
    </>
  );
}
