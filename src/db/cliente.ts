import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export function urlDb(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL en el archivo .env. Copia la dirección de conexión de tu proyecto en Neon (empieza con postgresql://).",
    );
  }
  return url;
}

/** Crea la conexión a Postgres (Neon). Se usa desde la app, los scripts y las pruebas. */
export function crearDb(url: string = urlDb()) {
  const pool = new Pool({
    connectionString: url,
    max: 5,
    // Neon cierra conexiones inactivas; mantenemos el pool pequeño y con timeout.
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
  const db = drizzle(pool, { schema });
  return Object.assign(db, { cerrar: () => pool.end() });
}

export type DB = ReturnType<typeof crearDb>;
