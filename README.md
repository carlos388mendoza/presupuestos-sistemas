# Presupuestos de Sistemas

Aplicación para armar los presupuestos del departamento de Sistemas en aperturas y remodelaciones de restaurantes.

Funciones principales:

- Presupuestos organizados por partidas, cada una con varias alternativas de proveedores. Se elige una por partida.
- Cotizaciones subidas (PDF o imagen, leídas con IA vía OpenRouter) o ingresadas a mano.
- Compras nacionales e internacionales en el mismo presupuesto, con totales separados en USD y HNL, sin conversión.
- Catálogo de equipos editable. Los equipos nuevos que trae una cotización se agregan solos y quedan "por revisar".
- Exportación a Excel cuando el presupuesto está listo, solo como descarga.
- Roles: administrador (maneja usuarios y ve todo) y creador (solo ve sus presupuestos).

## Tecnologías

Next.js 16 (App Router) · TypeScript · Tailwind 4 · Drizzle ORM + Postgres en [Neon](https://neon.com/docs/introduction) · Better-auth · ExcelJS · OpenRouter · Vitest

## Instalación

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

Llena el `.env`:

| Variable | Qué es |
| --- | --- |
| `DATABASE_URL` | Dirección de conexión de Neon (`postgresql://...?sslmode=require`, versión *pooled*) |
| `BETTER_AUTH_SECRET` | Texto largo y aleatorio (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | `http://localhost:3000` en desarrollo |
| `OPENROUTER_API_KEY` | Llave de openrouter.ai (con límite de crédito) |
| `OPENROUTER_MODEL` | ID de un modelo con visión/PDF y structured outputs |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Primer administrador |

Las cotizaciones se guardan localmente por defecto. Para producción puedes configurar un bucket privado de AWS S3 o Cloudflare R2 con `ARCHIVOS_STORAGE=s3`; pasos, permisos y variables están en la [guía de almacenamiento para Next.js](docs/almacenamiento-archivos-nextjs.md).

Luego:

```bash
npm run setup   # crea las tablas en Neon, el administrador y equipos de ejemplo
npm run dev     # http://localhost:3000
```

Los dos desarrolladores pueden usar la misma base de Neon (ven los mismos datos) o cada uno una *branch* de Neon propia para hacer pruebas sin afectar al otro.

Sin las variables de OpenRouter la app funciona igual; los archivos se adjuntan y los ítems se ingresan a mano.

## Scripts

| Comando | Para qué |
| --- | --- |
| `npm run dev` | Desarrollo |
| `npm run build` / `npm start` | Producción |
| `npm test` | Pruebas de reglas de negocio |
| `npm run db:generate` | Generar migración después de cambiar `src/db/schema.ts` |
| `npm run db:migrate` | Aplicar migraciones |
| `npm run db:seed` | Crear administrador y catálogo inicial |
| `npm run db:studio` | Ver la base de datos en el navegador |
| `npm run db:local` | (Opcional) Postgres local sin internet en el puerto 5433, por si Neon no está disponible |

## Estructura

```
src/
  app/
    login/                      Inicio de sesión
    (app)/presupuestos/         Lista, detalle y editor de alternativas
    (app)/catalogo/             Catálogo de equipos
    (app)/admin/usuarios/       Usuarios (solo administrador)
    api/cotizaciones/extraer/   Subida + lectura con IA
    api/presupuestos/[id]/excel Descarga del Excel
    api/archivos/[id]           Ver cotizaciones subidas (con permisos)
  actions/                      Server actions (validación con zod)
  db/                           Esquema y conexión
  lib/
    datos.ts                    Reglas de negocio y permisos (todo pasa por aquí)
    dinero.ts                   Centavos, formatos y totales por moneda
    extraccion.ts               Llamada a OpenRouter
    coincidencias.ts            Cruce de ítems con el catálogo
    excel.ts                    Generación del Excel
  proxy.ts                      Redirección al login
scripts/                        Migración y seed
tests/                          Pruebas con Vitest (usan un Postgres temporal, no tocan Neon)
drizzle/                        Migraciones SQL
```

## Reglas de negocio

- Los montos se guardan en centavos enteros. Dólares y lempiras nunca se suman ni se convierten.
- Solo puede haber una alternativa elegida por partida (lo garantiza también un índice en la base de datos).
- El total del presupuesto usa solo las alternativas elegidas.
- Un presupuesto se marca como "listo" solo si todas sus partidas tienen alternativa elegida. Listo = no editable hasta reabrirlo.
- El Excel solo se descarga con el presupuesto listo.
- Los archivos de cotización se guardan en `uploads/` localmente o en un bucket S3/R2 privado; la base guarda sus metadatos y proveedor.
- Quien crea el presupuesto elige las alternativas. El administrador puede ver y editar todos.

## Trabajo en equipo

Cada tarea en su rama (`feat/...`), integrada con Pull Request a `main`. Los cambios al esquema (`src/db/schema.ts`) los hace una persona a la vez y siempre con su migración (`npm run db:generate`).
