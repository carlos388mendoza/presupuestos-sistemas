import { db } from "@/db";
import { requerirAdmin } from "@/lib/sesion";
import { listarUsuarios } from "@/lib/usuarios";
import { NOMBRES_ROL } from "@/lib/datos";
import { cambiarActivo, cambiarRol, crearUsuario, restablecerContrasena } from "@/actions/usuarios";
import { FormAccion } from "@/components/FormAccion";
import { Etiqueta } from "@/components/Etiqueta";
import { ModalFormulario } from "@/components/ModalFormulario";

export default async function PaginaUsuarios() {
  const actual = await requerirAdmin();
  const usuarios = await listarUsuarios(db);

  return (
    <>
      <div className="mb-6">
        <h1 className="titulo-pagina">Usuarios</h1>
        <p className="ayuda">
          Los creadores de presupuestos solo ven los suyos. Los aprobadores ven todos, eligen las alternativas, marcan
          como listo y descargan el Excel, pero no editan. Los administradores ven todo y manejan usuarios.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="panel h-fit divide-y divide-linea-2">
          {usuarios.map((u) => (
            <li key={u.id} className={`px-4 py-4 ${u.activo ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {u.name} {u.id === actual.id && <span className="text-sm font-normal text-suave">(tú)</span>}
                  </div>
                  <div className="truncate text-sm text-suave">{u.email}</div>
                </div>
                {!u.activo && <Etiqueta tipo="aviso">Desactivado</Etiqueta>}
                <FormAccion action={cambiarRol} enLinea className="flex items-center gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <label className="sr-only" htmlFor={`rol-${u.id}`}>Rol de {u.name}</label>
                  <select id={`rol-${u.id}`} name="role" defaultValue={u.role} className="campo w-auto py-1.5">
                    <option value="creador">Creador</option>
                    <option value="aprobador">Aprobador</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <button className="btn-texto">Cambiar</button>
                </FormAccion>
                <FormAccion
                  action={cambiarActivo}
                  enLinea
                  className="flex items-center"
                  confirmar={u.activo ? `¿Desactivar a ${u.name}? Se cerrarán sus sesiones.` : undefined}
                >
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="activo" value={u.activo ? "0" : "1"} />
                  <button className={u.activo ? "btn-peligro" : "btn-texto"}>{u.activo ? "Desactivar" : "Activar"}</button>
                </FormAccion>
              </div>
              <details className="mt-2">
                <summary className="btn-texto cursor-pointer px-0">Cambiar contraseña</summary>
                <FormAccion action={restablecerContrasena} limpiarAlTerminar className="mt-2 flex max-w-md gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <label className="sr-only" htmlFor={`p-${u.id}`}>Nueva contraseña</label>
                  <input id={`p-${u.id}`} name="password" type="text" minLength={8} required autoComplete="off"
                    placeholder="Nueva contraseña" className="campo" />
                  <button className="btn-secundario shrink-0">Guardar</button>
                </FormAccion>
              </details>
            </li>
          ))}
        </ul>

        <aside className="panel h-fit p-5">
          <ModalFormulario titulo="Nuevo usuario">
            <FormAccion action={crearUsuario} limpiarAlTerminar className="space-y-3">
              <div>
                <label className="etiqueta" htmlFor="u-name">Nombre</label>
                <input id="u-name" name="name" required maxLength={120} className="campo" />
              </div>
              <div>
                <label className="etiqueta" htmlFor="u-email">Correo</label>
                <input id="u-email" name="email" type="email" required className="campo" />
              </div>
              <div>
                <label className="etiqueta" htmlFor="u-pass">Contraseña temporal</label>
                <input id="u-pass" name="password" type="text" minLength={8} required autoComplete="off" className="campo" />
                <p className="ayuda mt-1">Mínimo 8 caracteres.</p>
              </div>
              <div>
                <label className="etiqueta" htmlFor="u-role">Rol</label>
                <select id="u-role" name="role" defaultValue="creador" className="campo">
                  <option value="creador">{NOMBRES_ROL.creador}</option>
                  <option value="aprobador">{NOMBRES_ROL.aprobador}</option>
                  <option value="admin">{NOMBRES_ROL.admin}</option>
                </select>
              </div>
              <button className="btn-primario w-full">Crear usuario</button>
            </FormAccion>
          </ModalFormulario>
        </aside>
      </div>
    </>
  );
}
