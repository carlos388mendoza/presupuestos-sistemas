import "./env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { crearDb } from "../src/db/cliente";

async function main() {
  const db = crearDb();
  await migrate(db, { migrationsFolder: "./drizzle" });
  await db.cerrar();
  console.log("Base de datos lista.");
}

main().catch((e) => {
  console.error("No se pudo preparar la base de datos:", e.message);
  process.exit(1);
});
