# Guía para agentes

Lee `README.md` (reglas de negocio y estructura) y `AGENTS.md` (Next.js 16 tiene cambios: `proxy.ts` reemplaza a middleware; los `params` son Promise).

- Toda regla de negocio y permiso va en `src/lib/datos.ts` (recibe `db` para poder probarse). Las páginas y acciones solo llaman a esa capa.
- Base de datos: Postgres en Neon con drizzle (`drizzle-orm/node-postgres`). Todas las consultas son async. Las pruebas usan PGlite y no tocan Neon.
- Roles: `admin`, `creador` y `aprobador`. Los permisos se deciden con `puedeVerTodo`, `permisosPresupuesto` (`modificar` / `decidir`), `puedeCrearPresupuestos` y `puedeManejarUsuarios` de `datos.ts`; no compares `role` directamente en páginas ni acciones. El aprobador ve todo y decide (elegir, listo/reabrir, Excel) pero no modifica.
- `.env` local apunta a la branch `desarrollo` de Neon; Vercel usa `production`.
- Montos en centavos enteros; nunca convertir USD/HNL.
- Publicada en Vercel (plan Hobby); `main` se publica solo. Archivos en Vercel Blob privado vía `src/lib/archivos.ts`; nunca URLs públicas, siempre servidos por `/api/archivos/[id]` tras `puedeVerArchivo`. Límites: 4 MB por archivo (`src/lib/limites.ts`), `maxDuration` 300 s. Nada se escribe en disco en producción.
- Server actions en `src/actions`, validadas con zod, devuelven `{ error }` / `{ ok }` y se usan con `<FormAccion>`.
- Formularios: usa los componentes de `src/components/campos` (`CampoTexto`, `CampoContrasena`, `CampoSelect`, `AreaTexto`, `Casilla`, `OpcionRadio`) en vez de inputs sueltos.
- El texto de la interfaz no se puede seleccionar (`user-select: none` en `body`). Los campos y `.cifra` sí; para otro texto copiable usa la clase `seleccionable`.
- Tailwind 4: clases propias definidas con `@utility` en `globals.css` (tokens: tinta, usd, hnl, linea, suave…).
- Tablas anchas dentro de `overflow-x-auto`: el contenedor debe ser `relative`, o los `sr-only` (absolutos) se salen y crean scroll horizontal en la página.
- Si una vista existe dos veces (tabla en computadora y tarjetas en celular), sus `id` deben ser distintos; los `id` de filas deben ser estables entre servidor y navegador (nada de contadores globales ni `Math.random()`).
- Las server actions que llama un componente cliente fuera de `<FormAccion>` deben devolver `{ error }`, no lanzar.
- Estado vivo del proyecto (issues, pendientes, cómo retomar): `ESTADO.md`.
- Interfaz en español. Corre `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` antes de terminar (es lo mismo que corre el CI).
