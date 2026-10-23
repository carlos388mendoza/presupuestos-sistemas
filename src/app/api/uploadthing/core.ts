import { eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { puedeCrearPresupuestos } from "@/lib/datos";
import { borrarArchivo, leerArchivo } from "@/lib/archivos";
import { procesarCotizacion } from "@/lib/procesar-cotizacion";
import { obtenerUsuario } from "@/lib/sesion";

const f = createUploadthing();
const config = {
  "application/pdf": { maxFileSize: "4MB", maxFileCount: 1, acl: "private" },
  "image/jpeg": { maxFileSize: "4MB", maxFileCount: 1, acl: "private" },
  "image/png": { maxFileSize: "4MB", maxFileCount: 1, acl: "private" },
  "image/webp": { maxFileSize: "4MB", maxFileCount: 1, acl: "private" },
} as const;

async function limpiarArchivoPrivado(key: string) {
  await borrarArchivo(key, "uploadthing").catch((error) => {
    console.error("No se pudo eliminar un archivo privado de UploadThing.", error);
  });
}

export const ourFileRouter = {
  cotizacion: f(config, { awaitServerData: true })
    .middleware(async ({ files }) => {
      if (files.length !== 1) throw new UploadThingError("Sube un solo archivo de cotización a la vez.");
      const usuario = await obtenerUsuario();
      if (!usuario) throw new UploadThingError("Tu sesión expiró. Vuelve a iniciar sesión.");
      if (!puedeCrearPresupuestos(usuario)) throw new UploadThingError("Tu rol no permite subir cotizaciones.");
      if (process.env.ARCHIVOS_STORAGE !== "uploadthing") {
        throw new UploadThingError("Configura ARCHIVOS_STORAGE=uploadthing para usar esta zona de carga.");
      }
      return { usuarioId: usuario.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const [usuario] = await db.select().from(user).where(eq(user.id, metadata.usuarioId)).limit(1);
        if (!usuario?.activo || !puedeCrearPresupuestos(usuario)) {
          throw new UploadThingError("Tu cuenta ya no tiene permiso para subir cotizaciones.");
        }

        const almacenamiento = { nombreGuardado: file.key, almacenamiento: "uploadthing" as const };
        const buffer = await leerArchivo(file.key, "uploadthing");
        return await procesarCotizacion(
          { id: usuario.id, name: usuario.name, email: usuario.email, role: usuario.role },
          { nombre: file.name, mime: file.type, tamano: file.size, buffer },
          almacenamiento,
        );
      } catch (error) {
        await limpiarArchivoPrivado(file.key);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
