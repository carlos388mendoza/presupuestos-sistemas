import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import type { Rol } from "@/db/schema";

export type UsuarioActual = {
  id: string;
  name: string;
  email: string;
  role: Rol;
};

/** Devuelve el usuario de la sesión o null. Consulta la DB para tener rol y estado al día. */
export const obtenerUsuario = cache(async (): Promise<UsuarioActual | null> => {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = await db.query.user.findFirst({ where: eq(user.id, s.user.id) });
  if (!u || !u.activo) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role };
});

/** Para páginas: redirige al login si no hay sesión. */
export async function requerirUsuario(): Promise<UsuarioActual> {
  const u = await obtenerUsuario();
  if (!u) redirect("/login");
  return u;
}

/** Para páginas de administración. */
export async function requerirAdmin(): Promise<UsuarioActual> {
  const u = await requerirUsuario();
  if (u.role !== "admin") redirect("/presupuestos");
  return u;
}

export class ErrorPermiso extends Error {
  constructor(mensaje = "No tienes permiso para esta acción.") {
    super(mensaje);
    this.name = "ErrorPermiso";
  }
}

/** Para acciones y APIs: lanza error en vez de redirigir. */
export async function usuarioOError(): Promise<UsuarioActual> {
  const u = await obtenerUsuario();
  if (!u) throw new ErrorPermiso("Tu sesión expiró. Vuelve a iniciar sesión.");
  return u;
}

export async function adminOError(): Promise<UsuarioActual> {
  const u = await usuarioOError();
  if (u.role !== "admin") throw new ErrorPermiso();
  return u;
}
