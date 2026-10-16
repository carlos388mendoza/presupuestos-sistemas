import "server-only";
import { crearDb, type DB } from "./cliente";

// En desarrollo Next recarga módulos; reutilizamos el pool de conexiones.
const globalParaDb = globalThis as unknown as { __db?: DB };

export const db: DB = globalParaDb.__db ?? crearDb();
if (process.env.NODE_ENV !== "production") globalParaDb.__db = db;
