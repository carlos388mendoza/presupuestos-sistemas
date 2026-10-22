import { db } from "@/db";
import { requerirUsuario } from "@/lib/sesion";
import { contarPendientes } from "@/lib/catalogo";
import { puedeCrearPresupuestos, puedeManejarUsuarios } from "@/lib/datos";
import { NavegacionApp } from "./NavegacionApp";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await requerirUsuario();
  const pendientes = await contarPendientes(db);

  return <NavegacionApp
    usuario={{ name: usuario.name, role: usuario.role }}
    pendientes={pendientes}
    puedeCrear={puedeCrearPresupuestos(usuario)}
    puedeUsuarios={puedeManejarUsuarios(usuario)}
  >{children}</NavegacionApp>;
}
