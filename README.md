# Presupuestos de Sistemas

AplicaciÃ³n para armar los presupuestos del departamento de Sistemas en aperturas y remodelaciones de restaurantes.

Funciones principales:

- Presupuestos organizados por partidas, cada una con varias alternativas de proveedores. Se elige una por partida.
- Cotizaciones subidas (PDF o imagen, leÃ­das con IA vÃ­a OpenRouter) o ingresadas a mano.
- Compras nacionales e internacionales en el mismo presupuesto, con totales separados en USD y HNL, sin conversiÃ³n.
- CatÃ¡logo de equipos editable. Los equipos nuevos que trae una cotizaciÃ³n se agregan solos y quedan "por revisar".
- ExportaciÃ³n a Excel cuando el presupuesto estÃ¡ listo, solo como descarga.
- Roles: administrador (maneja usuarios y ve todo), creador (solo ve sus presupuestos) y aprobador (ve todos, elige las alternativas y marca como listo, sin editar).

## TecnologÃ­as

Next.js 16 (App Router) Â· TypeScript Â· Tailwind 4 Â· Drizzle ORM + Postgres en [Neon](https://neon.com/docs/introduction) Â· Better-auth Â· ExcelJS Â· OpenRouter Â· Vitest

## InstalaciÃ³n

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

Llena el `.env`:

| Variable | QuÃ© es |
| --- | --- |
| `DATABASE_URL` | DirecciÃ³n de conexiÃ³n de Neon (`postgresql://...?sslmode=require`, versiÃ³n *pooled*) |
| `BETTER_AUTH_SECRET` | Texto largo y aleatorio (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | `http://localhost:3000` en desarrollo; la direcciÃ³n pÃºblica `https://...` en producciÃ³n |
| `OPENROUTER_API_KEY` | Llave de openrouter.ai (con lÃ­mite de crÃ©dito) |
| OPENROUTER_MODEL | ID de un modelo con visi?n y structured outputs. Recomendado gratis: 
vidia/nemotron-3.5-super-vl:free. Los PDFs se convierten a texto en el servidor (primeras 5 p?ginas) antes de enviarlos; si el PDF es una imagen escaneada, no se llama a la IA. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Primer administrador |

Las cotizaciones se guardan en la carpeta `uploads/` en desarrollo y en **Vercel Blob privado** al publicar en Vercel (`ARCHIVOS_STORAGE=blob`, es el valor por defecto dentro de Vercel). TambiÃ©n se puede usar UploadThing (`uploadthing`) o AWS S3/Cloudflare R2 (`s3`); pasos y variables en la [guÃ­a de almacenamiento](docs/almacenamiento-archivos-nextjs.md). En todos los casos los archivos se ven solo por `/api/archivos/[id]`, que revisa que seas el dueÃ±o, administrador o aprobador (este Ãºltimo solo los que ya estÃ¡n en un presupuesto). TamaÃ±o mÃ¡ximo por archivo: 4 MB (Vercel no acepta envÃ­os de mÃ¡s de 4.5 MB).

Luego:

```bash
npm run setup   # crea las tablas en Neon, el administrador y equipos de ejemplo
npm run dev     # http://localhost:3000
```

En tu computadora usa la *branch* `desarrollo` de Neon (copia de producciÃ³n), no la de producciÃ³n: asÃ­ las pruebas no tocan los datos reales. La app publicada en Vercel usa la branch principal (`production`). Si cambias el esquema, aplica la migraciÃ³n primero en `desarrollo` y, despuÃ©s de unir el PR, en producciÃ³n.

Para cargar los presupuestos de ejemplo, confirma primero en Neon que `DATABASE_URL` apunta a `desarrollo` y define `DATABASE_BRANCH=desarrollo` en tu `.env`. `npm run db:ejemplos` rechaza otros destinos y no se ejecuta en Vercel ni en producciÃ³n. Puedes correrlo varias veces sin duplicar los ejemplos.

Sin las variables de OpenRouter la app funciona igual; los archivos se adjuntan y los Ã­tems se ingresan a mano.

## PublicaciÃ³n en Vercel

La app estÃ¡ publicada en Vercel (proyecto `presupuestos-grupo-comidas`), conectado a GitHub: cada cambio que entra a `main` se publica solo; cada Pull Request genera una vista previa.

- **Variables en Vercel** (Settings â†’ Environment Variables): `DATABASE_URL`, `BETTER_AUTH_SECRET` (distinto al de desarrollo), `BETTER_AUTH_URL` (direcciÃ³n pÃºblica con `https://`), `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` y `ARCHIVOS_STORAGE=blob`.
- **Vercel Blob**: almacenamiento privado conectado al proyecto (pestaÃ±a Storage). Vercel agrega solo sus credenciales; no hay que copiarlas.
- **Migraciones**: si cambia `src/db/schema.ts`, corre `npm run db:migrate` con la `DATABASE_URL` de Neon antes o justo despuÃ©s de unir el cambio a `main`.
- **LÃ­mites del plan gratis (Hobby)**: la lectura con IA puede tardar hasta 300 segundos; los archivos, hasta 4 MB.
- Better-auth usa cookies seguras (solo HTTPS) cuando `BETTER_AUTH_URL` empieza con `https://`, y acepta inicios de sesiÃ³n desde esa direcciÃ³n y desde las vistas previas de Vercel.

## Scripts

| Comando | Para quÃ© |
| --- | --- |
| `npm run dev` | Desarrollo |
| `npm run build` / `npm start` | ProducciÃ³n |
| `npm test` | Pruebas de reglas de negocio |
| `npm run db:generate` | Generar migraciÃ³n despuÃ©s de cambiar `src/db/schema.ts` |
| `npm run db:migrate` | Aplicar migraciones |
| `npm run db:seed` | Crear administrador y catÃ¡logo inicial |
| `npm run db:ejemplos` | Agregar dos presupuestos ficticios (solo Neon desarrollo) |
| `npm run db:studio` | Ver la base de datos en el navegador |
| `npm run db:local` | (Opcional) Postgres local sin internet en el puerto 5433, por si Neon no estÃ¡ disponible |

## Estructura

```
src/
  app/
    login/                      Inicio de sesiÃ³n
    (app)/presupuestos/         Lista, detalle y editor de alternativas
    (app)/catalogo/             CatÃ¡logo de equipos
    (app)/admin/usuarios/       Usuarios (solo administrador)
    api/cotizaciones/extraer/   Subida + lectura con IA
    api/presupuestos/[id]/excel Descarga del Excel
    api/archivos/[id]           Ver cotizaciones subidas (con permisos)
  actions/                      Server actions (validaciÃ³n con zod)
  db/                           Esquema y conexiÃ³n
  lib/
    datos.ts                    Reglas de negocio y permisos (todo pasa por aquÃ­)
    dinero.ts                   Centavos, formatos y totales por moneda
    extraccion.ts               Llamada a OpenRouter
    coincidencias.ts            Cruce de Ã­tems con el catÃ¡logo
    excel.ts                    GeneraciÃ³n del Excel
  proxy.ts                      RedirecciÃ³n al login
scripts/                        MigraciÃ³n y seed
tests/                          Pruebas con Vitest (usan PGlite en memoria, no tocan Neon)
drizzle/                        Migraciones SQL
```

## Reglas de negocio

- Los montos se guardan en centavos enteros. DÃ³lares y lempiras nunca se suman ni se convierten.
- Solo puede haber una alternativa elegida por partida (lo garantiza tambiÃ©n un Ã­ndice en la base de datos).
- El total del presupuesto usa solo las alternativas elegidas.
- Un presupuesto se marca como "listo" solo si todas sus partidas tienen alternativa elegida. Listo = no editable hasta reabrirlo.
- El Excel solo se descarga con el presupuesto listo.
- Los archivos de cotizaciÃ³n se guardan en Vercel Blob privado en producciÃ³n (en `uploads/` solo en desarrollo local); la base guarda sus metadatos y dÃ³nde estÃ¡n. Nunca tienen enlace pÃºblico: se ven por `/api/archivos/[id]`.
- Roles:
  - **Creador de presupuestos**: crea, edita y elige alternativas solo en sus presupuestos.
  - **Aprobador de presupuestos**: ve todos los presupuestos del departamento, elige o quita la alternativa de cada partida, marca como listo o reabre, descarga el Excel y ve las cotizaciones. No crea, edita ni borra presupuestos, partidas ni alternativas, ni sube cotizaciones, ni maneja usuarios.
  - **Administrador**: ve y edita todo, y maneja usuarios.

## Trabajo en equipo

Cada tarea en su rama (`feat/...` o `fix/...`), integrada con Pull Request a `main`; nada se sube directo a `main`. Para que un PR cierre su issue al unirse, escribe `Closes #N` (en inglÃ©s) en la descripciÃ³n.

- **CI:** cada PR corre `.github/workflows/ci.yml` (lint, `tsc`, `npm test` y `npm run build`), y Vercel genera una vista previa que usa la branch `desarrollo` de Neon. Une el PR solo si ambos pasan.
- **DespuÃ©s de bajar `main`**, corre `npm ci`: si el otro agregÃ³ una librerÃ­a y no la instalas, la app falla con "Module not found".
- **Esquema:** los cambios a `src/db/schema.ts` los hace una persona a la vez y siempre con su migraciÃ³n (`npm run db:generate`). La migraciÃ³n se aplica primero en `desarrollo` y, despuÃ©s de unir el PR, en producciÃ³n.
