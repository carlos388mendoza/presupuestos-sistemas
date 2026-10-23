import { asc, eq, ilike, or, and, inArray } from "drizzle-orm";
import type { DB } from "@/db/cliente";
import { equipos, itemsAlternativa, user } from "@/db/schema";
import { ErrorNegocio } from "./datos";

export type EquipoEntrada = {
  nombre: string;
  marca: string;
  modelo: string;
  descripcion: string;
  categoria: string;
};

export async function listarEquipos(db: DB, filtro: { q?: string; soloPendientes?: boolean } = {}) {
  const condiciones = [];
  if (filtro.q) {
    const t = `%${filtro.q}%`;
    condiciones.push(
      or(ilike(equipos.nombre, t), ilike(equipos.marca, t), ilike(equipos.modelo, t), ilike(equipos.categoria, t)),
    );
  }
  if (filtro.soloPendientes) condiciones.push(eq(equipos.revisado, false));
  return db
    .select({
      id: equipos.id, nombre: equipos.nombre, marca: equipos.marca, modelo: equipos.modelo,
      descripcion: equipos.descripcion, categoria: equipos.categoria, origen: equipos.origen,
      revisado: equipos.revisado, createdAt: equipos.createdAt, updatedAt: equipos.updatedAt,
      creadoPor: user.name,
    })
    .from(equipos)
    .leftJoin(user, eq(equipos.creadoPor, user.id))
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(asc(equipos.categoria), asc(equipos.nombre));
}

export async function contarPendientes(db: DB): Promise<number> {
  return (await db.select({ id: equipos.id }).from(equipos).where(eq(equipos.revisado, false))).length;
}

export async function crearEquipo(db: DB, usuarioId: string, datos: EquipoEntrada) {
  const [e] = await db.insert(equipos).values({ ...datos, creadoPor: usuarioId, origen: "manual", revisado: true }).returning();
  return e;
}

export async function actualizarEquipo(db: DB, id: string, datos: EquipoEntrada) {
  await db.update(equipos).set({ ...datos, updatedAt: new Date() }).where(eq(equipos.id, id));
}

export async function aprobarEquipo(db: DB, id: string) {
  await db.update(equipos).set({ revisado: true, updatedAt: new Date() }).where(eq(equipos.id, id));
}

export async function eliminarEquipo(db: DB, id: string) {
  // Los ítems que lo usaban conservan su descripción y quedan sin vincular.
  await db.delete(equipos).where(eq(equipos.id, id));
}

export async function aprobarEquipos(db: DB, ids: string[]) {
  if (!ids.length) return;
  await db.update(equipos).set({ revisado: true, updatedAt: new Date() }).where(inArray(equipos.id, ids));
}

export async function eliminarEquipos(db: DB, ids: string[]) {
  if (!ids.length) return;
  // Los ítems conservan su descripción y quedan sin vincular por onDelete: set null.
  await db.delete(equipos).where(inArray(equipos.id, ids));
}

/** Une un equipo duplicado (origen) con uno existente (destino) y borra el duplicado. */
export async function fusionarEquipo(db: DB, origenId: string, destinoId: string) {
  if (origenId === destinoId) throw new ErrorNegocio("Elige un equipo distinto para fusionar.");
  const [destino] = await db.select().from(equipos).where(eq(equipos.id, destinoId));
  if (!destino) throw new ErrorNegocio("No se encontró el equipo destino.");
  await db.transaction(async (tx) => {
    await tx.update(itemsAlternativa).set({ equipoId: destinoId }).where(eq(itemsAlternativa.equipoId, origenId));
    await tx.delete(equipos).where(eq(equipos.id, origenId));
  });
}
