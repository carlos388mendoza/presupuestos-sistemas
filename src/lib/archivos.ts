import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export const CARPETA_UPLOADS = path.join(process.cwd(), "uploads");
export const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB

export const TIPOS_PERMITIDOS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function guardarEnDisco(buffer: Buffer, extension: string): Promise<string> {
  await fs.mkdir(CARPETA_UPLOADS, { recursive: true });
  const nombre = `${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(CARPETA_UPLOADS, nombre), buffer);
  return nombre;
}

export async function leerDeDisco(nombreGuardado: string): Promise<Buffer> {
  // basename evita rutas como ../../
  return fs.readFile(path.join(CARPETA_UPLOADS, path.basename(nombreGuardado)));
}
