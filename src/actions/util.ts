import "server-only";
import { z } from "zod";
import { ErrorNegocio } from "@/lib/datos";
import { ErrorPermiso } from "@/lib/sesion";
import type { EstadoAccion } from "@/lib/tipos";

/** Convierte errores conocidos en mensajes para el usuario; relanza los demás (incluye redirect()). */
export function aEstado(e: unknown): EstadoAccion {
  if (e instanceof ErrorNegocio || e instanceof ErrorPermiso) return { error: e.message };
  if (e instanceof z.ZodError) return { error: e.issues[0]?.message ?? "Datos inválidos." };
  throw e;
}

export const texto = (campo: string, max = 200) =>
  z.string().trim().min(1, `${campo} es obligatorio.`).max(max, `${campo} es demasiado largo.`);

export const textoOpcional = (max = 2000) => z.string().trim().max(max).default("");

export function datosDe(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}
