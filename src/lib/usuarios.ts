import { asc, eq, and, ne } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import type { DB } from "@/db/cliente";
import { account, session, user, type Rol } from "@/db/schema";
import { ErrorNegocio } from "./datos";

export async function listarUsuarios(db: DB) {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      activo: user.activo,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.name));
}

/** Crea un usuario con contraseña (proveedor "credential" de Better-auth). */
export async function crearUsuario(
  db: DB,
  datos: { name: string; email: string; password: string; role: Rol },
) {
  const email = datos.email.trim().toLowerCase();
  const [existe] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (existe) throw new ErrorNegocio("Ya existe un usuario con ese correo.");

  const hash = await hashPassword(datos.password);
  const id = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(user).values({ id, name: datos.name.trim(), email, role: datos.role, emailVerified: true });
    await tx
      .insert(account)
      .values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash });
  });
  return id;
}

async function adminsActivosExcepto(db: DB, id: string) {
  const filas = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "admin"), eq(user.activo, true), ne(user.id, id)));
  return filas.length;
}

export async function cambiarRol(db: DB, actorId: string, id: string, role: Rol) {
  if (actorId === id && role !== "admin") {
    throw new ErrorNegocio("No puedes quitarte el rol de administrador a ti mismo.");
  }
  if (role !== "admin" && (await adminsActivosExcepto(db, id)) === 0) {
    throw new ErrorNegocio("Debe quedar al menos un administrador activo.");
  }
  await db.update(user).set({ role }).where(eq(user.id, id));
}

export async function cambiarActivo(db: DB, actorId: string, id: string, activo: boolean) {
  if (!activo) {
    if (actorId === id) throw new ErrorNegocio("No puedes desactivar tu propio usuario.");
    const [u] = await db.select().from(user).where(eq(user.id, id));
    if (u?.role === "admin" && (await adminsActivosExcepto(db, id)) === 0) {
      throw new ErrorNegocio("Debe quedar al menos un administrador activo.");
    }
  }
  await db.transaction(async (tx) => {
    await tx.update(user).set({ activo }).where(eq(user.id, id));
    // Cierra sus sesiones abiertas al desactivarlo
    if (!activo) await tx.delete(session).where(eq(session.userId, id));
  });
}

export async function restablecerContrasena(db: DB, id: string, password: string) {
  const hash = await hashPassword(password);
  const actualizadas = await db
    .update(account)
    .set({ password: hash })
    .where(and(eq(account.userId, id), eq(account.providerId, "credential")))
    .returning({ id: account.id });
  if (actualizadas.length === 0) {
    await db
      .insert(account)
      .values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash });
  }
  await db.delete(session).where(eq(session.userId, id));
}
