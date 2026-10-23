"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { usuarioOError } from "@/lib/sesion";
import * as datos from "@/lib/datos";
import type { EstadoAccion } from "@/lib/tipos";
import { aEstado, datosDe, texto, textoOpcional } from "./util";

const esquemaPresupuesto = z.object({
  nombre: texto("El nombre"),
  restaurante: texto("El restaurante"),
  tipo: z.enum(["apertura", "remodelacion"], { message: "Elige el tipo de proyecto." }),
  notas: textoOpcional(),
});

export async function crearPresupuesto(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  let id: string;
  try {
    const u = await usuarioOError();
    const d = esquemaPresupuesto.parse(datosDe(fd));
    const p = await datos.crearPresupuesto(db, u, d);
    // Partidas iniciales opcionales, una por línea
    const iniciales = (fd.get("partidas")?.toString() ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30);
    for (const nombre of iniciales) await datos.crearPartida(db, u, p.id, nombre.slice(0, 120));
    id = p.id;
  } catch (e) {
    return aEstado(e);
  }
  redirect(`/presupuestos/${id}`);
}

export async function actualizarPresupuesto(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    const u = await usuarioOError();
    const id = z.string().parse(fd.get("id"));
    await datos.actualizarPresupuesto(db, u, id, esquemaPresupuesto.parse(datosDe(fd)));
    revalidatePath(`/presupuestos/${id}`);
    return { ok: "Cambios guardados." };
  } catch (e) {
    return aEstado(e);
  }
}

export async function eliminarPresupuesto(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    const u = await usuarioOError();
    await datos.eliminarPresupuesto(db, u, z.string().parse(fd.get("id")));
  } catch (e) {
    return aEstado(e);
  }
  redirect("/presupuestos");
}

export async function crearPartida(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    const u = await usuarioOError();
    const presupuestoId = z.string().parse(fd.get("presupuestoId"));
    await datos.crearPartida(db, u, presupuestoId, texto("El nombre de la partida", 120).parse(fd.get("nombre") ?? ""));
    revalidatePath(`/presupuestos/${presupuestoId}`);
    return { ok: "Partida agregada." };
  } catch (e) {
    return aEstado(e);
  }
}

export async function renombrarPartida(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    const u = await usuarioOError();
    const id = z.string().parse(fd.get("id"));
    await datos.renombrarPartida(db, u, id, texto("El nombre de la partida", 120).parse(fd.get("nombre") ?? ""));
    revalidatePath("/presupuestos/[id]", "page");
    return { ok: "Guardado." };
  } catch (e) {
    return aEstado(e);
  }
}

export async function eliminarPartida(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    const u = await usuarioOError();
    await datos.eliminarPartida(db, u, z.string().parse(fd.get("id")));
    revalidatePath("/presupuestos/[id]", "page");
    return null;
  } catch (e) {
    return aEstado(e);
  }
}

export async function elegirAlternativa(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    const u = await usuarioOError();
    const id = z.string().parse(fd.get("id"));
    if (fd.get("quitar") === "1") await datos.quitarEleccion(db, u, id);
    else await datos.elegirAlternativa(db, u, id);
    revalidatePath("/presupuestos/[id]", "page");
    return null;
  } catch (e) {
    return aEstado(e);
  }
}

export async function eliminarAlternativa(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    const u = await usuarioOError();
    await datos.eliminarAlternativa(db, u, z.string().parse(fd.get("id")));
    revalidatePath("/presupuestos/[id]", "page");
    return null;
  } catch (e) {
    return aEstado(e);
  }
}

export async function cambiarEstado(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    const u = await usuarioOError();
    const id = z.string().parse(fd.get("id"));
    if (fd.get("estado") === "listo") await datos.marcarListo(db, u, id);
    else await datos.reabrir(db, u, id);
    revalidatePath(`/presupuestos/${id}`);
    return null;
  } catch (e) {
    return aEstado(e);
  }
}

const esquemaAlternativa = z.object({
  id: z.string().optional(),
  partidaId: z.string().min(1),
  proveedor: texto("El proveedor", 150),
  tipoCompra: z.enum(["nacional", "internacional"]),
  notas: textoOpcional(),
  archivoId: z.string().nullable(),
  items: z
    .array(
      z.object({
        equipoId: z.string().nullable(),
        crearEquipo: z.boolean(),
        origenEquipo: z.enum(["manual", "ia"]),
        descripcion: texto("La descripción de cada ítem", 300),
        marca: textoOpcional(120),
        modelo: textoOpcional(120),
        cantidad: z.number({ message: "Revisa las cantidades." }).positive("Las cantidades deben ser mayores que cero."),
        precioUnitarioCentavos: z
          .number({ message: "Revisa los precios." })
          .int()
          .nonnegative("Los precios no pueden ser negativos."),
        moneda: z.enum(["USD", "HNL"]),
      }),
    )
    .min(1, "Agrega al menos un ítem."),
});

export type EntradaAlternativa = z.input<typeof esquemaAlternativa>;

export async function guardarAlternativa(entrada: EntradaAlternativa): Promise<EstadoAccion> {
  let destino: string;
  try {
    const u = await usuarioOError();
    const d = esquemaAlternativa.parse(entrada);
    const altId = await datos.guardarAlternativa(db, u, d);
    const { presupuesto, partida } = await datos.obtenerAlternativa(db, u, altId);
    revalidatePath(`/presupuestos/${presupuesto.id}`);
    revalidatePath("/catalogo");
    destino = `/presupuestos/${presupuesto.id}#partida-${partida.id}`;
  } catch (e) {
    return aEstado(e);
  }
  redirect(destino);
}

const esquemaAlternativasAgrupadas = z.object({
  presupuestoId: z.string().min(1),
  alternativas: z.array(z.object({
    partidaId: z.string().min(1),
    proveedor: texto("El proveedor", 150),
    tipoCompra: z.enum(["nacional", "internacional"]),
    notas: textoOpcional(),
    archivoId: z.string().nullable(),
    items: z.array(z.object({
      equipoId: z.string().nullable(),
      crearEquipo: z.boolean(),
      origenEquipo: z.enum(["manual", "ia"]),
      descripcion: texto("La descripción de cada ítem", 300),
      marca: textoOpcional(120),
      modelo: textoOpcional(120),
      cantidad: z.number().positive("Las cantidades deben ser mayores que cero."),
      precioUnitarioCentavos: z.number().int().nonnegative("Los precios no pueden ser negativos."),
      moneda: z.enum(["USD", "HNL"]),
    })).min(1),
  })).min(1),
});

export type EntradaAlternativasAgrupadas = z.input<typeof esquemaAlternativasAgrupadas>;

export async function guardarAlternativasAgrupadas(entrada: EntradaAlternativasAgrupadas): Promise<EstadoAccion> {
  let destino: string;
  try {
    const usuario = await usuarioOError();
    const datosEntrada = esquemaAlternativasAgrupadas.parse(entrada);
    await datos.guardarAlternativasAgrupadas(db, usuario, datosEntrada.presupuestoId, datosEntrada.alternativas);
    revalidatePath(`/presupuestos/${datosEntrada.presupuestoId}`);
    revalidatePath("/catalogo");
    destino = `/presupuestos/${datosEntrada.presupuestoId}`;
  } catch (error) {
    return aEstado(error);
  }
  redirect(destino);
}

export async function marcarListoAccion(presupuestoId: string): Promise<void> {
  const u = await usuarioOError();
  await datos.marcarListo(db, u, presupuestoId);
  revalidatePath(`/presupuestos/${presupuestoId}`);
}

export async function reabrirAccion(presupuestoId: string): Promise<void> {
  const u = await usuarioOError();
  await datos.reabrir(db, u, presupuestoId);
  revalidatePath(`/presupuestos/${presupuestoId}`);
}
