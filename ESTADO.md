# ESTADO.md: estado del proyecto

Última revisión: 2026-10-26, por Claude Code con Carlos.
`main` en `3d5daac` (antes de este PR, que solo cambia este archivo). PR abierto: [#98](https://github.com/carlos388mendoza/presupuestos-sistemas/pull/98), del compañero (no tocar).

## Resumen
- App interna de Grupo Comidas (Honduras), departamento de Sistemas, para presupuestos de aperturas y remodelaciones de restaurantes.
- Next.js 16, TypeScript, Tailwind 4, Drizzle + Postgres (Neon), Better-auth, ExcelJS/PDFKit, OpenRouter, Vercel Blob y Vitest (PGlite).
- Publicada en https://presupuestos-grupo-comidas.vercel.app. Vercel publica solo cada cambio en `main`; cada PR tiene vista previa y CI (`.github/workflows/ci.yml`).
- Roles: `admin`, `creador` y `aprobador` (ver README → Reglas de negocio).

## Base de datos (Neon)
| Branch | Uso | Migraciones (0000, 0001, 0002) | `archivos.almacenamiento` / `equipos.creado_por` |
|---|---|---|---|
| `production` (principal) | Vercel Production | Las 3 aplicadas | Sí / Sí |
| `desarrollo` | `.env` local y vistas previas de Vercel | Las 3 aplicadas | Sí / Sí |

- El `.env` local apunta a `desarrollo` (pooled). `.env.respaldo-produccion` guarda la dirección de producción: nunca se sube ni se muestra.
- Para revisar migraciones sin mostrar direcciones se usa `drizzle.__drizzle_migrations` y se compara con `drizzle/meta/_journal.json`.

## Revisión del 23/10/2026: qué se hizo
- **#63** (columnas creado por / creado el / actualizado el): verificado en `desarrollo` y en los registros de producción. Cerrado con un comentario. "Desconocido" es esperado para los equipos anteriores a la migración `0002`.
- **Recorrido completo** con admin, creador y aprobador en el puerto 3001, contra `desarrollo`, a 1280, 768 y 375 px. Se probó:
  - login; crear presupuesto, partidas y alternativa manual; subir un PDF; elegir; marcar listo y reabrir; Excel y PDF;
  - catálogo: agregar, editar, aprobar y fusionar;
  - usuarios: crear, cambiar rol, cambiar contraseña y desactivar;
  - permisos por URL directa.
  Los datos de prueba se borraron.
- **Arreglos unidos:**
  - [#75](https://github.com/carlos388mendoza/presupuestos-sistemas/pull/75): scroll horizontal en tablas anchas, error de hidratación en el editor, `id` repetidos en Usuarios (campos sin etiqueta en celular) y acciones de la búsqueda global que fallaban sin avisar.
  - [#76](https://github.com/carlos388mendoza/presupuestos-sistemas/pull/76): el dueño no podía editar una alternativa cuya cotización subió el admin (con prueba).
  - [#77](https://github.com/carlos388mendoza/presupuestos-sistemas/pull/77): redondeo de centavos (`1.005` → 1.01) y precio máximo con mensaje claro en vez de error 500 (con pruebas).
- **Pruebas:** 28 en 6 archivos, todas pasan. `lint`, `tsc` y `build` sin errores.

## Revisión del 26/10/2026
- **Issues:** no hay abiertos. #78–#81 (reglas de permisos y carrera), #91–#94 (PDF, dropzone, README) y #58/#93 (reabiertos y vueltos a cerrar) quedaron resueltos en PRs unidos.
- **main:** `lint`, `tsc`, `build` y 37 pruebas pasan; el CI pasa. Migraciones 0000–0002 aplicadas en `production` y `desarrollo`.
- **IA (OpenRouter, modelo gratis de NVIDIA):**
  - Los PDFs con texto se convierten a texto en el servidor (primeras 5 páginas) y solo se envía el texto; los escaneados no llaman a la IA y muestran un aviso para subir una foto.
  - El modelo gratis de NVIDIA a veces falla (error 502 o más de 2 minutos sin responder). Por eso [#99](https://github.com/carlos388mendoza/presupuestos-sistemas/pull/99) permite poner varios modelos separados por coma en `OPENROUTER_MODEL`: el primero es el principal y los demás de respaldo.
  - Vercel (Production y Preview) y el `.env` local usan `nvidia/nemotron-3.5-super-vl:free,dots-studio/dots-3-note-preview:free`.
  - **Llave de OpenRouter:** es de Carlos (la IA es responsabilidad suya). Está en su `.env` local y en Vercel (Production y Preview), cambiada el 26/10 a las 17:37 UTC. Vercel la guarda como secreta (no se puede leer); se comprobó con una huella que la de Preview es igual a la local. Probada el 26/10: local 19 s (PDF, incluye compilar) / 4 s (foto); vista previa 23 s / 12 s; escaneado con su aviso. Sin errores de OpenRouter en producción.
  - #99 también le enseña a la IA a reconocer proveedores de Honduras como "nacional" (antes los marcaba "internacional").
  - Probado en la vista previa de #99 con PDF de texto, foto PNG y PDF escaneado: los tres bien, 10–15 s cada uno.
  - Límites de los modelos gratis: unas 20 solicitudes por minuto y 50 por día (1000 por día si se compran USD 10 de créditos en OpenRouter).
- Los datos de prueba en `desarrollo` se borraron.

## Pendiente: configuración (lo hace Carlos)
- **Proteger `main` en GitHub** para que solo se una por PR (Settings → Rules / Branches).
- `npm audit` reporta vulnerabilidades en dependencias. No es urgente; revisar con calma.

## Para retomar (Claude Code o Codex)
1. Leer `README.md`, `CLAUDE.md`, `AGENTS.md` y este archivo.
2. `git pull` en `main` y luego `npm ci` (si falta una librería nueva, la app falla con "Module not found").
3. Servidor de prueba: `npm run dev -- -p 3001` (el puerto 3000 es de otra app). Si no toma un cambio de CSS, detenerlo, borrar `.next\dev` y volver a arrancarlo.
4. Datos de prueba: solo en `desarrollo` y siempre borrarlos al terminar. Nunca crear datos de prueba en producción.
5. Cada cambio va en una rama con su PR. Se une si pasan el CI y la vista previa de Vercel.



## Historial 26/10/2026 (mañana)
- PDFs a texto con unpdf: [#84](https://github.com/carlos388mendoza/presupuestos-sistemas/pull/84). Buscador global estilo wiki (Acciones, Ir a, Presupuestos y Equipos): [#85](https://github.com/carlos388mendoza/presupuestos-sistemas/pull/85).
