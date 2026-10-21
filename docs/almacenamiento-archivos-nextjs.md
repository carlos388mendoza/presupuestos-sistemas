# Guardar cotizaciones en S3 o Cloudflare R2

La aplicación puede guardar las cotizaciones en el disco local o en un bucket compatible con S3. Cloudflare R2 y AWS S3 funcionan con el mismo código. El bucket permanece privado: las descargas pasan por `/api/archivos/[id]`, que comprueba la sesión y los permisos del presupuesto antes de leer el objeto.

## Componentes que ya vienen listos

La pantalla de alternativas ya incluye el control de selección, el estado de subida, los mensajes de error y el enlace al archivo:

- `src/app/(app)/presupuestos/[id]/alternativas/EditorAlternativa.tsx`: componente de interfaz; manda el archivo como `FormData`.
- `src/app/api/cotizaciones/extraer/route.ts`: valida sesión, tipo y tamaño, guarda el archivo y opcionalmente extrae los datos de la cotización.
- `src/app/api/archivos/[id]/route.ts`: sirve el archivo solo después de validar acceso.
- `src/lib/archivos.ts`: adaptador de almacenamiento local/S3.

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

Despliega la aplicación con las variables del bucket configuradas. Las nuevas subidas irán al bucket. Cada registro guarda su ubicación (`local` o `s3`), así que cambiar la configuración no hace que la aplicación busque archivos antiguos en el proveedor equivocado. Los archivos locales anteriores deben conservarse en el disco original o copiarse al bucket antes de retirar ese disco.

`ARCHIVOS_STORAGE` vale `local` por defecto para desarrollo. El límite actual sigue siendo 10 MB y los tipos permitidos son PDF, JPG, PNG y WEBP. Si OpenRouter está configurado, el contenido también se envía al proveedor de IA para extraer los datos de la cotización.

## Seguridad y operación

- Mantén las claves `S3_*` solo en variables de entorno del servidor; no uses el prefijo `NEXT_PUBLIC_`.
- Usa un bucket privado, TLS y claves de mínimo privilegio.
- Las descargas no usan URL pública ni URL prefirmada: la ruta de Next.js comprueba acceso antes de enviar el contenido.
- `ARCHIVOS_STORAGE=s3` sin bucket o credenciales falla con un mensaje de configuración en el servidor.
- Los archivos nuevos se guardan con una clave aleatoria, sin usar el nombre recibido del navegador.
