import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { UTApi } from "uploadthing/server";
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

export type AlmacenamientoArchivo = "local" | "s3" | "uploadthing";
let clienteS3Cache: S3Client | undefined;
let clienteUploadThingCache: UTApi | undefined;

function almacenamientoConfigurado(): AlmacenamientoArchivo {
  const valor = process.env.ARCHIVOS_STORAGE ?? "local";
  if (valor === "local" || valor === "s3" || valor === "uploadthing") return valor;
  throw new Error("ARCHIVOS_STORAGE debe ser 'local', 's3' o 'uploadthing'.");
}

function clienteUploadThing() {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) throw new Error("Configura UPLOADTHING_TOKEN para guardar archivos en UploadThing.");
  if (!clienteUploadThingCache) clienteUploadThingCache = new UTApi({ token });
  return clienteUploadThingCache;
}

function clienteS3() {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Para usar almacenamiento S3 configura S3_BUCKET, S3_ACCESS_KEY_ID y S3_SECRET_ACCESS_KEY.");
  }

  const endpoint = process.env.S3_ENDPOINT;
  if (!clienteS3Cache) {
    clienteS3Cache = new S3Client({
      region: process.env.S3_REGION || (endpoint ? "auto" : "us-east-1"),
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return {
    bucket,
    cliente: clienteS3Cache,
  };
}

function nombreSeguro(extension: string) {
  return `${crypto.randomUUID()}.${extension}`;
}

export async function guardarArchivo(
  buffer: Buffer,
  extension: string,
  mime: string,
): Promise<{ nombreGuardado: string; almacenamiento: AlmacenamientoArchivo }> {
  const almacenamiento = almacenamientoConfigurado();
  const nombreGuardado = nombreSeguro(extension);

  if (almacenamiento === "local") {
    await fs.mkdir(CARPETA_UPLOADS, { recursive: true });
    await fs.writeFile(path.join(CARPETA_UPLOADS, nombreGuardado), buffer);
  } else if (almacenamiento === "s3") {
    const { bucket, cliente } = clienteS3();
    await cliente.send(new PutObjectCommand({ Bucket: bucket, Key: nombreGuardado, Body: buffer, ContentType: mime }));
  } else {
    const resultado = await clienteUploadThing().uploadFiles(
      new File([new Uint8Array(buffer)], nombreGuardado, { type: mime }),
      { acl: "private" },
    );
    if (resultado.error) throw new Error(`UploadThing no pudo guardar el archivo: ${resultado.error.message}`);
    return { nombreGuardado: resultado.data.key, almacenamiento };
  }

  return { nombreGuardado, almacenamiento };
}

export async function leerArchivo(nombreGuardado: string, almacenamiento: AlmacenamientoArchivo): Promise<Buffer> {
  if (almacenamiento === "local") {
    // basename evita rutas como ../../ en registros locales anteriores.
    return fs.readFile(path.join(CARPETA_UPLOADS, path.basename(nombreGuardado)));
  }

  if (almacenamiento === "s3") {
    const { bucket, cliente } = clienteS3();
    const respuesta = await cliente.send(new GetObjectCommand({ Bucket: bucket, Key: nombreGuardado }));
    if (!respuesta.Body) throw new Error("El objeto no tiene contenido.");
    return Buffer.from(await respuesta.Body.transformToByteArray());
  }

  const { ufsUrl } = await clienteUploadThing().generateSignedURL(nombreGuardado, { expiresIn: 60 });
  const respuesta = await fetch(ufsUrl, { cache: "no-store" });
  if (!respuesta.ok) throw new Error(`UploadThing no pudo devolver el archivo (${respuesta.status}).`);
  return Buffer.from(await respuesta.arrayBuffer());
}

export async function borrarArchivo(nombreGuardado: string, almacenamiento: AlmacenamientoArchivo): Promise<void> {
  if (almacenamiento === "local") {
    await fs.unlink(path.join(CARPETA_UPLOADS, path.basename(nombreGuardado)));
    return;
  }

  if (almacenamiento === "s3") {
    const { bucket, cliente } = clienteS3();
    await cliente.send(new DeleteObjectCommand({ Bucket: bucket, Key: nombreGuardado }));
    return;
  }

  const resultado = await clienteUploadThing().deleteFiles(nombreGuardado);
  if (!resultado.success) throw new Error("UploadThing no pudo eliminar el archivo.");
}
