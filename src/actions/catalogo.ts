"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { usuarioOError } from "@/lib/sesion";
import * as catalogo from "@/lib/catalogo";
import type { EstadoAccion } from "@/lib/tipos";
import { aEstado, datosDe, texto, textoOpcional } from "./util";

const esquemaEquipo = z.object({
  nombre: texto("El nombre", 200),
  marca: textoOpcional(120),
  modelo: textoOpcional(120),
  descripcion: textoOpcional(1000),
  categoria: textoOpcional(80),
});

// Cualquier usuario con sesión puede editar el catálogo.

export async function crearEquipo(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await usuarioOError();
    await catalogo.crearEquipo(db, esquemaEquipo.parse(datosDe(fd)));
    revalidatePath("/catalogo");
    return { ok: "Equipo agregado al catálogo." };
  } catch (e) {
    return aEstado(e);
  }
}

export async function actualizarEquipo(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await usuarioOError();
    const id = z.string().parse(fd.get("id"));
    await catalogo.actualizarEquipo(db, id, esquemaEquipo.parse(datosDe(fd)));
    if (fd.get("aprobar") === "1") await catalogo.aprobarEquipo(db, id);
    revalidatePath("/catalogo");
    return { ok: "Guardado." };
  } catch (e) {
    return aEstado(e);
  }
}

export async function aprobarEquipo(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await usuarioOError();
    await catalogo.aprobarEquipo(db, z.string().parse(fd.get("id")));
    revalidatePath("/catalogo");
    return null;
  } catch (e) {
    return aEstado(e);
  }
}

export async function eliminarEquipo(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await usuarioOError();
    await catalogo.eliminarEquipo(db, z.string().parse(fd.get("id")));
    revalidatePath("/catalogo");
    return null;
  } catch (e) {
    return aEstado(e);
  }
}

export async function fusionarEquipo(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await usuarioOError();
    const origen = z.string().parse(fd.get("id"));
    const destino = z.string().min(1, "Elige con qué equipo fusionarlo.").parse(fd.get("destinoId") ?? "");
    await catalogo.fusionarEquipo(db, origen, destino);
    revalidatePath("/catalogo");
    return { ok: "Equipos fusionados." };
  } catch (e) {
    return aEstado(e);
  }
}

export async function actuarEquiposEnLote(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await usuarioOError();
    const ids = z.array(z.string().uuid()).min(1, "Selecciona al menos un equipo.").max(200, "Selecciona como máximo 200 equipos.").parse(fd.getAll("id"));
    const operacion = z.enum(["aprobar", "eliminar"]).parse(fd.get("operacion"));
    if (operacion === "aprobar") {
      await catalogo.aprobarEquipos(db, ids);
      revalidatePath("/catalogo");
      return { ok: `${ids.length} equipo(s) marcados como revisados.` };
    }
    await catalogo.eliminarEquipos(db, ids);
    revalidatePath("/catalogo");
    return { ok: `${ids.length} equipo(s) eliminados del catálogo.` };
  } catch (e) {
    return aEstado(e);
  }
}
