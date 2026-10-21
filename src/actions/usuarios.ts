"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { adminOError } from "@/lib/sesion";
import * as usuarios from "@/lib/usuarios";
import type { EstadoAccion } from "@/lib/tipos";
import { aEstado, texto } from "./util";

const contrasena = z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(128);
const rol = z.enum(["admin", "creador", "aprobador"], { message: "Elige un rol." });

export async function crearUsuario(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await adminOError();
    const d = z
      .object({
        name: texto("El nombre", 120),
        email: z.string().trim().email("Escribe un correo válido."),
        password: contrasena,
        role: rol,
      })
      .parse(Object.fromEntries(fd));
    await usuarios.crearUsuario(db, d);
    revalidatePath("/admin/usuarios");
    return { ok: `Usuario creado. Comparte la contraseña temporal con ${d.name}.` };
  } catch (e) {
    return aEstado(e);
  }
}

export async function cambiarRol(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    const actor = await adminOError();
    await usuarios.cambiarRol(db, actor.id, z.string().parse(fd.get("id")), rol.parse(fd.get("role")));
    revalidatePath("/admin/usuarios");
    return null;
  } catch (e) {
    return aEstado(e);
  }
}

export async function cambiarActivo(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    const actor = await adminOError();
    await usuarios.cambiarActivo(db, actor.id, z.string().parse(fd.get("id")), fd.get("activo") === "1");
    revalidatePath("/admin/usuarios");
    return null;
  } catch (e) {
    return aEstado(e);
  }
}

export async function restablecerContrasena(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await adminOError();
    await usuarios.restablecerContrasena(db, z.string().parse(fd.get("id")), contrasena.parse(fd.get("password")));
    return { ok: "Contraseña actualizada. Se cerraron sus sesiones abiertas." };
  } catch (e) {
    return aEstado(e);
  }
}
