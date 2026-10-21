import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { crearDb, type DB } from "@/db/cliente";
import { user, type Rol } from "@/db/schema";
import type { Actor } from "@/lib/datos";

let puerto = 55000 + Math.floor(Math.random() * 1000);
const abiertos: (() => Promise<void>)[] = [];

/**
 * Base Postgres de prueba (PGlite) expuesta por socket, para usar el mismo
 * driver `pg` que en producción con Neon.
 */
export async function dbDePrueba() {
  const pglite = await PGlite.create();
  const port = puerto++;
  const server = new PGLiteSocketServer({ db: pglite, port, host: "127.0.0.1", maxConnections: 20 });
  await server.start();
  const db: DB = crearDb(`postgresql://postgres:postgres@127.0.0.1:${port}/postgres`);
  await migrate(db, { migrationsFolder: "./drizzle" });

  abiertos.push(async () => {
    await db.cerrar();
    await server.stop();
    await pglite.close();
  });

  const mk = async (id: string, role: Rol): Promise<Actor> => {
    await db.insert(user).values({ id, name: id, email: `${id}@prueba.hn`, role });
    return { id, role };
  };
  return {
    db,
    admin: await mk("admin", "admin"),
    ana: await mk("ana", "creador"),
    beto: await mk("beto", "creador"),
    damaris: await mk("damaris", "aprobador"),
  };
}

export async function cerrarTodo() {
  while (abiertos.length) await abiertos.pop()!();
}

export const item = (precio: number, moneda: "USD" | "HNL", cantidad = 1) => ({
  equipoId: null,
  crearEquipo: false,
  origenEquipo: "manual" as const,
  descripcion: "Equipo",
  marca: "",
  modelo: "",
  cantidad,
  precioUnitarioCentavos: precio,
  moneda,
});
