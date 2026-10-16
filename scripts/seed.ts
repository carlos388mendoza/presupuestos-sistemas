import "./env";
import { eq } from "drizzle-orm";
import { crearDb } from "../src/db/cliente";
import { equipos, user } from "../src/db/schema";
import { crearUsuario } from "../src/lib/usuarios";

const db = crearDb();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Define ADMIN_EMAIL y ADMIN_PASSWORD en el archivo .env");
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD debe tener al menos 8 caracteres.");
    process.exitCode = 1;
    return;
  }

  const [existe] = await db.select().from(user).where(eq(user.email, email));
  if (existe) {
    console.log(`El administrador ${email} ya existe.`);
  } else {
    await crearUsuario(db, { name: process.env.ADMIN_NAME || "Administrador", email, password, role: "admin" });
    console.log(`Administrador creado: ${email}`);
  }

  const [hayEquipos] = await db.select({ id: equipos.id }).from(equipos).limit(1);
  if (!hayEquipos) {
    const base = [
      { nombre: "Switch administrable 24 puertos PoE", categoria: "Redes" },
      { nombre: "Access point Wi-Fi", categoria: "Redes" },
      { nombre: "Router / firewall", categoria: "Redes" },
      { nombre: "Gabinete de rack de pared", categoria: "Redes" },
      { nombre: "Cable UTP Cat 6 (bobina 305 m)", categoria: "Cableado" },
      { nombre: "Punto de red Cat 6 instalado", categoria: "Cableado" },
      { nombre: "Terminal punto de venta (POS)", categoria: "Punto de venta" },
      { nombre: "Impresora térmica de recibos", categoria: "Impresión" },
      { nombre: "Impresora de cocina", categoria: "Impresión" },
      { nombre: "Gaveta de dinero", categoria: "Punto de venta" },
      { nombre: "Cámara IP", categoria: "Seguridad" },
      { nombre: "Grabador NVR", categoria: "Seguridad" },
      { nombre: "UPS", categoria: "Energía" },
      { nombre: "Pantalla de cocina (KDS)", categoria: "Cocina" },
    ];
    await db.insert(equipos).values(base.map((e) => ({ ...e, origen: "manual" as const, revisado: true })));
    console.log(`Catálogo inicial: ${base.length} equipos de ejemplo.`);
  }
}

main()
  .catch((e) => {
    console.error("Error al crear los datos iniciales:", e.message);
    process.exitCode = 1;
  })
  .finally(() => db.cerrar());
