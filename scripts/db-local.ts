/**
 * Postgres local SIN internet (opcional), por si Neon no está disponible.
 * Guarda los datos en ./data/pglite. Déjalo corriendo en una terminal aparte y usa:
 *   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/postgres
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import fs from "node:fs";

async function main() {
  fs.mkdirSync("./data", { recursive: true });
  const db = await PGlite.create("./data/pglite");
  const server = new PGLiteSocketServer({ db, port: 5433, host: "127.0.0.1", maxConnections: 20 });
  await server.start();
  console.log("Postgres local escuchando en 127.0.0.1:5433 (Ctrl+C para detener)");
  const cerrar = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };
  process.on("SIGINT", cerrar);
  process.on("SIGTERM", cerrar);
}

main();
