# Guardar cotizaciones en UploadThing, S3 o Cloudflare R2

La aplicación puede guardar las cotizaciones localmente, en Vercel Blob privado (lo que usa la app publicada), en UploadThing o en un bucket compatible con S3 como Cloudflare R2 o AWS S3.

## Vercel Blob (producción)

1. En el proyecto de Vercel: **Storage → Create → Blob**, acceso **Private**, conectado a todos los entornos. Vercel agrega solo las credenciales.
2. `ARCHIVOS_STORAGE=blob` en las variables del proyecto (dentro de Vercel es el valor por defecto si se deja vacío).
3. Los archivos se guardan como `cotizaciones/<uuid>.<ext>` con `access: "private"`. Nadie puede abrirlos con su URL; `/api/archivos/[id]` comprueba permisos y los lee con `get()` del SDK.
4. Para probar en tu computadora, pon `ARCHIVOS_STORAGE=blob` y el `BLOB_READ_WRITE_TOKEN` del almacenamiento en tu `.env`. Las descargas siempre pasan por `/api/archivos/[id]`, que comprueba la sesión y los permisos del presupuesto antes de leer el archivo.

## Componentes que ya vienen listos

La pantalla de alternativas ya incluye el control de selección, el estado de subida, los mensajes de error y el enlace al archivo:

- `src/app/(app)/presupuestos/[id]/alternativas/EditorAlternativa.tsx`: componente de interfaz; manda el archivo como `FormData`.
- `src/app/api/cotizaciones/extraer/route.ts`: valida sesión, tipo y tamaño, guarda el archivo y opcionalmente extrae los datos de la cotización.
- `src/app/api/archivos/[id]/route.ts`: sirve el archivo solo después de validar acceso.
- `src/lib/archivos.ts`: adaptador de almacenamiento local/UploadThing/S3.

El componente existente ya usa el flujo. Para una pantalla propia de Next.js, el patrón de subida es:

```tsx
async function subirCotizacion(file: File) {
  const form = new FormData();
  form.set("archivo", file);
  const response = await fetch("/api/cotizaciones/extraer", {
    method: "POST",
    body: form,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "No se pudo subir el archivo");
  return result as { archivoId: string; archivoNombre: string; aviso?: string };
}
```

No establezcas manualmente `Content-Type`: el navegador agrega el boundary correcto para `FormData`. La ruta devuelve un `archivoId`; al guardar la alternativa, la base de datos lo asocia con ella. El enlace de lectura es `/api/archivos/<archivoId>`.

## UploadThing

Al configurar `ARCHIVOS_STORAGE=uploadthing`, las pantallas para crear y editar alternativas usan el componente oficial `UploadDropzone`. El endpoint valida la sesión y el rol antes de permitir la subida, exige ACL privada desde el inicio y, al terminar, registra el archivo y devuelve el mismo borrador que se obtiene con los demás proveedores. Si UploadThing no admite la ACL privada, la subida falla antes de aceptar el archivo. En los otros modos de almacenamiento se conserva la zona de carga de la aplicación.

**Requisito del plan:** UploadThing confirma que los archivos privados solo están disponibles en planes de pago. El plan gratuito publica los archivos y cualquier persona que tenga su URL puede abrirlos; no lo uses para las cotizaciones internas de esta aplicación. Consulta [regiones y controles ACL de UploadThing](https://docs.uploadthing.com/concepts/regions-acl). Para mantener los archivos privados sin pagar un plan de UploadThing, usa Cloudflare R2 o AWS S3 siguiendo las secciones de abajo.

1. Entra al [dashboard de UploadThing](https://uploadthing.com/dashboard), crea una aplicación y copia su token.
2. Usa un plan que admita archivos privados y habilita los overrides de ACL. La app solicita `acl: "private"` como parte de la autorización de subida para que el archivo no quede público mientras se procesa.
3. En `.env` local (y luego en las variables del entorno donde se despliega), configura:

   ```dotenv
   ARCHIVOS_STORAGE=uploadthing
   UPLOADTHING_TOKEN=<token-de-la-app>
   ```

4. Mantén el token solo del lado servidor. No lo publiques en el repositorio ni lo pongas en una variable `NEXT_PUBLIC_*`.
5. Aplica la migración con `npm run db:migrate` y reinicia/despliega la app.

La ruta registra la clave que devuelve UploadThing en la base. Al descargar, primero comprueba los permisos, genera un enlace privado temporal de 60 segundos en el servidor y transmite el archivo por `/api/archivos/[id]`. La integración tipada de React usa un `FileRouter` servido desde `/api/uploadthing` y espera su respuesta del servidor antes de completar la subida en el navegador.

## Cloudflare R2

1. Crea un bucket R2 privado y un token de API con lectura y escritura de objetos únicamente para ese bucket.
2. Copia el identificador de cuenta, el nombre del bucket, el Access Key ID y el Secret Access Key.
3. Configura estas variables en `.env` local y en el entorno de despliegue:

   ```dotenv
   ARCHIVOS_STORAGE=s3
   S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   S3_REGION=auto
   S3_BUCKET=<nombre-del-bucket>
   S3_ACCESS_KEY_ID=<access-key-id>
   S3_SECRET_ACCESS_KEY=<secret-access-key>
   S3_FORCE_PATH_STYLE=true
   ```

No configures un dominio público para el bucket; la aplicación transmite los archivos mediante una ruta que verifica permisos.

## AWS S3

Crea un bucket privado y una identidad con permisos `s3:PutObject`, `s3:GetObject` y `s3:DeleteObject` limitados a ese bucket. Configura:

```dotenv
ARCHIVOS_STORAGE=s3
S3_REGION=us-east-1
S3_BUCKET=<nombre-del-bucket>
S3_ACCESS_KEY_ID=<access-key-id>
S3_SECRET_ACCESS_KEY=<secret-access-key>
S3_FORCE_PATH_STYLE=true
```

Deja `S3_ENDPOINT` vacío para que el SDK use el endpoint de AWS de la región configurada. Para otra región, sustituye `us-east-1` por ella.

## Migrar y desplegar

Después de instalar una versión que incluya la migración, aplica el esquema a la base de datos:

```bash
npm run db:migrate
```

Despliega la aplicación con las variables del proveedor configuradas. Las nuevas subidas usarán ese proveedor. Cada registro guarda su ubicación (`local`, `s3` o `uploadthing`), así que cambiar la configuración no hace que la aplicación busque archivos antiguos en el proveedor equivocado. Los archivos locales anteriores deben conservarse en el disco original o migrarse antes de retirar ese disco.

`ARCHIVOS_STORAGE` vale `local` por defecto para desarrollo. El límite actual sigue siendo 10 MB y los tipos permitidos son PDF, JPG, PNG y WEBP. Si OpenRouter está configurado, el contenido también se envía al proveedor de IA para extraer los datos de la cotización.

## Seguridad y operación

- Mantén `S3_*` y `UPLOADTHING_TOKEN` solo en variables de entorno del servidor; no uses el prefijo `NEXT_PUBLIC_`.
- Usa un bucket privado, TLS y claves de mínimo privilegio.
- La ruta protegida de Next.js comprueba acceso antes de enviar el contenido; UploadThing usa un enlace privado de corta duración solo entre el servidor y el proveedor.
- `ARCHIVOS_STORAGE=s3` sin bucket o credenciales, o `ARCHIVOS_STORAGE=uploadthing` sin token, falla con un mensaje de configuración en el servidor.
- Los archivos nuevos se guardan con una clave aleatoria, sin usar el nombre recibido del navegador.
