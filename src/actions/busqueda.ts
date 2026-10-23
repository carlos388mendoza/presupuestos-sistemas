"use server";

import { db } from "@/db";
import { usuarioOError } from "@/lib/sesion";
import * as datos from "@/lib/datos";
import type { ResultadoBusquedaGlobal } from "@/lib/datos";

export async function buscarGlobalAction(consulta: string): Promise<ResultadoBusquedaGlobal> {
  const usuario = await usuarioOError();
  return datos.buscarGlobal(db, usuario, consulta ?? "");
}