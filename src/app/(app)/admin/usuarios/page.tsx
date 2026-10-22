import { db } from "@/db";
import { requerirAdmin } from "@/lib/sesion";
import { listarUsuarios } from "@/lib/usuarios";
import { NOMBRES_ROL } from "@/lib/datos";
import { crearUsuario } from "@/actions/usuarios";
import { FormAccion } from "@/components/FormAccion";
import { ModalFormulario } from "@/components/ModalFormulario";
import { ListaUsuarios } from "./ListaUsuarios";

export default async function PaginaUsuarios() {
  const actual = await requerirAdmin();
  const usuarios = await listarUsuarios(db);

  return (
    <>
      <div className="mb-6">
        <h1 className="titulo-pagina">Usuarios</h1>
        <p className="ayuda mt-1 max-w-3xl">Administra las cuentas, sus roles y el acceso al sistema.</p>
      </div>

      <section className="panel overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-linea-2 p-5">
          <div>
            <h2 className="font-semibold">Cuentas</h2>
            <p className="ayuda">Gestiona roles, acceso y contraseñas.</p>
          </div>
          <ModalFormulario titulo="Nuevo usuario" trigger="+ Nuevo usuario" triggerClassName="btn-primario min-h-11 px-5">
            <FormAccion action={crearUsuario} limpiarAlTerminar className="formulario">
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
                <p className="ayuda mt-1.5">Mínimo 8 caracteres.</p>
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
        </header>
        <ListaUsuarios usuarios={usuarios} actualId={actual.id} />
      </section>
    </>
  );
}
