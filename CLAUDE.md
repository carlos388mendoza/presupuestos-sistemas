# Guía para agentes

Lee `README.md` (reglas de negocio y estructura) y `AGENTS.md` (Next.js 16 tiene cambios: `proxy.ts` reemplaza a middleware; los `params` son Promise).

- Toda regla de negocio y permiso va en `src/lib/datos.ts` (recibe `db` para poder probarse). Las páginas y acciones solo llaman a esa capa.
- Base de datos: Postgres en Neon con drizzle (`drizzle-orm/node-postgres`). Todas las consultas son async. Las pruebas usan PGlite y no tocan Neon.
- Montos en centavos enteros; nunca convertir USD/HNL.
- Publicada en Vercel (plan Hobby); `main` se publica solo. Archivos en Vercel Blob privado vía `src/lib/archivos.ts`; nunca URLs públicas, siempre servidos por `/api/archivos/[id]` tras `puedeVerArchivo`. Límites: 4 MB por archivo (`src/lib/limites.ts`), `maxDuration` 300 s. Nada se escribe en disco en producción.
- Server actions en `src/actions`, validadas con zod, devuelven `{ error }` / `{ ok }` y se usan con `<FormAccion>`.
- Tailwind 4: clases propias definidas con `@utility` en `globals.css` (tokens: tinta, usd, hnl, linea, suave…).
- Interfaz en español. Corre `npm test` y `npm run build` antes de terminar.
