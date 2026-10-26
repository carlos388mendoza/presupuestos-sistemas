# ESTADO.md: estado del proyecto

Última revisión: 2026-10-23 (tarde), por Claude Code con Carlos.
`main` en `3da484d` (después de este PR, el merge de `docs/estado-revision`). Sin PRs abiertos.

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

## Pendiente: issues abiertos (decisiones de reglas, no errores claros)
| # | Tema | Recomendación |
|---|---|---|
| [#78](https://github.com/carlos388mendoza/presupuestos-sistemas/issues/78) | Cualquier rol, incluido el aprobador, puede eliminar o fusionar equipos del catálogo | `puedeEditarCatalogo` (admin y creador) en `datos.ts` |
| [#79](https://github.com/carlos388mendoza/presupuestos-sistemas/issues/79) | El servidor permite eliminar un presupuesto listo | Usar `presupuestoEditable` en `eliminarPresupuesto` |
| [#80](https://github.com/carlos388mendoza/presupuestos-sistemas/issues/80) | Creador que pasa a aprobador sigue modificando sus presupuestos | `modificar` = no aprobador y (admin o dueño) |
| [#81](https://github.com/carlos388mendoza/presupuestos-sistemas/issues/81) | Carrera al marcar listo o elegir a la vez (posible 500) | Transacción con bloqueo y mensaje amigable |

## Pendiente: configuración (lo hace Carlos)
- **`OPENROUTER_MODEL` del `.env` local** es `google/gemini-3.8-flash-lite-tts`, un modelo de **voz** que no puede leer cotizaciones; OpenRouter responde 400. Hay que poner un modelo con visión/PDF, por ejemplo el de `.env.example`. Revisar que en Vercel (Production y Preview) tampoco sea uno "tts".
- **Proteger `main` en GitHub** para que solo se una por PR: ver la guía que se le dio a Carlos (Settings → Rules / Branches).
- `npm audit` reporta vulnerabilidades en dependencias. No es urgente; revisar con calma.

## Para retomar (Claude Code o Codex)
1. Leer `README.md`, `CLAUDE.md`, `AGENTS.md` y este archivo.
2. `git pull` en `main` y luego `npm ci` (si falta una librería nueva, la app falla con "Module not found").
3. Servidor de prueba: `npm run dev -- -p 3001` (el puerto 3000 es de otra app). Si no toma un cambio de CSS, detenerlo, borrar `.next\dev` y volver a arrancarlo.
4. Datos de prueba: solo en `desarrollo` y siempre borrarlos al terminar. Nunca crear datos de prueba en producción.
5. Cada cambio va en una rama con su PR. Se une si pasan el CI y la vista previa de Vercel.


## Actualizacion 26/10/2026
- Tarea 1: los PDFs se convierten a texto en el servidor con unpdf (primeras 5 paginas). Si hay texto suficiente se envia solo texto a la IA; si es escaneado no se llama a la IA y se muestra aviso.
- Modelo recomendado gratis: 
vidia/nemotron-3.5-super-vl:free (vision + structured outputs). Limites tipicos de OpenRouter para modelos gratis: ~20 solicitudes/minuto y ~50/dia (hasta 1000/dia con USD 10 de creditos), contexto 1M y salida 131k tokens.
- Tarea 2: buscador global redisenado estilo wiki con secciones Acciones, Ir a, Presupuestos y Equipos, iconos, subtitulos, ayuda inferior y modo oscuro.
- PRs: #84 (PDFs sin pagar), #85 (buscador wiki).
