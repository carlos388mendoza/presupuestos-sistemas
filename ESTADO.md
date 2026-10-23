# ESTADO.md - Revisión completa del proyecto
Fecha de revisión: 2026-10-23 14:00:00-06:00  
Commit actual de main: `0765957`  
Rama revisada: `main` (up to date con origin/main)  
Estado: limpio, sin cambios sin guardar ni sin subir

## Resumen del proyecto (5 líneas)
- **App interna** de Grupo Comidas (Honduras), depto. Sistemas, para presupuestos de aperturas y remodelaciones de restaurantes.  
- **Stack**: Next.js 16 (App Router), TypeScript, Tailwind 4, Drizzle ORM + Postgres, Better-auth, ExcelJS, OpenRouter, Vercel Blob/UploadThing/S3, Vitest.  
- **Reglas**: Un presupuesto tiene partidas con alternativas; se elige 1 por partida. Montos en centavos (USD/HNL separados). Listo solo si todas las partidas tienen alternativa elegida.  
- **Roles**: `admin` (todo + usuarios), `creador` (solo sus presupuestos), `aprobador` (ve todos, elige, marca listo/reabre, descarga Excel, ve cotizaciones; no crea/edita/sube/maneja usuarios).  
- **Publicación**: https://presupuestos-grupo-comidas.vercel.app, desplegado por Vercel desde `main`.

## Tabla de issues (todos)
| # | Título | Responsable | Estado | PR |
|---|---------|-------------|--------|-----|
| 2 | Guardar archivos en un bucket S3/R2/Uploadthing o similares | Sin asignar (PR de vbgjptt89g-beep) | CLOSED | #3 |
| 5 | Mover el formulario de nuevo equipo a un modal | Compañero (Jose17Pinto) | CLOSED | #18 |
| 7 | Agregar la opción de hacer click en una fila para acceder a sus detalles | Compañero (Jose17Pinto) | CLOSED | #20 |
| 8 | Estilizar o reemplazar inputs con estilos del navegador por componentes | Tú (carlos388mendoza) | CLOSED | #17 |
| 9 | Agregar un combobox con opción de agregar nuevos items en "Partidas iniciales" | Tú (carlos388mendoza) | CLOSED | #23 |
| 10 | Mover el formulario de nuevo usuario a un modal | Compañero (Jose17Pinto) | CLOSED | #19 |
| 11 | Mejorar el espacio entre componentes (formularios especialmente) | Tú (carlos388mendoza) | CLOSED | #24 |
| 12 | Integrar un Choice Box en lugar de radio boxes sueltos | Tú (carlos388mendoza) | CLOSED | #21 |
| 13 | Mejorar responsive en pantalla de usuarios | Tú (carlos388mendoza) | CLOSED | #25 |
| 14 | Agregar confirmación al cerrar sesión con un diálogo accesible | Tú (carlos388mendoza) | CLOSED | #26 |
| 15 | Agregar ejemplos de presupuestos | Compañero (Jose17Pinto) | CLOSED | #22 |
| 16 | Agregar `content-selectable: none` por defecto | Tú (carlos388mendoza) | CLOSED | #27 |
| 32 | Agregar buscador en los items de equipo del catalogo | Sin asignar (PR de carlos388mendoza) | CLOSED | #39 |
| 33 | Evitar usar el `alert` del navegador, utilizar uno personalizado | Sin asignar (PR de carlos388mendoza) | CLOSED | #40 |
| 34 | Cambiar campo de texto libre del restaurante por un combobox | Sin asignar (PR de vbgjptt89g-beep) | CLOSED | #37 |
| 35 | Mover formularios a modales en página de detalles del presupuesto | Sin asignar (PR de vbgjptt89g-beep) | CLOSED | #37 |
| 36 | Utilizar un modelo de IA/OCR para obtener datos de los PDFs | Sin asignar (PR de carlos388mendoza) | CLOSED | #40 |
| 48 | Integrar un componente dropzone en la pantalla de nueva alternativa | Sin asignar | CLOSED | Sin PR (cierre manual; luego integrado por #55) |
| 49 | Mejorar la velocidad del procesamiento de IA al agregar una partida | Sin asignar | CLOSED | Sin PR (cerrado manual) |
| 50 | Hacer un data table en la pantalla de catálogo de equipos | Sin asignar | CLOSED | Sin PR (cerrado manual; tabla ya existente/ajustada) |
| 51 | Evitar el botón "Filtrar" al buscar en la tabla catálogo de equipos | Sin asignar (PR de vbgjptt89g-beep) | CLOSED | #54 |
| 52 | Arreglar el overflow de la tabla "Usuarios" | Sin asignar (PR de vbgjptt89g-beep) | CLOSED | #54 |
| 53 | Cambiar tablas por tarjetas en /presupuestos/{id} en mobile | Sin asignar (commit directo a main) | CLOSED | Commit `63e812c` (sin PR) |
| 58 | Agregar espacio entre el input y el botón de guardar | Sin asignar (commit directo a main) | CLOSED | Commit `c276943` (sin PR) |
| 59 | Agregar campo de confirmar nueva contraseña | Sin asignar (PR de vbgjptt89g-beep) | CLOSED | #66 |
| 60 | bug: Se pierde el focus al buscar en la pantalla de Catálogo de equipos | Sin asignar (commit directo a main) | CLOSED | Commit `e3ab797` (sin PR) |
| 61 | Paginación en la pantalla de Catálogo de equipos | Sin asignar (PR de vbgjptt89g-beep) | CLOSED | #66 |
| 62 | Revisar el timeout en el procesamiento IA de una cotización | Sin asignar (commit directo a main) | CLOSED | Commit `019040c` (sin PR) |
| 63 | Agregar columnas de "creado por", "creado el", "última vez actualizado el" a la tabla de cátalogo de equipos | Sin asignar (PR de vbgjptt89g-beep, luego reabierto) | **OPEN** | #66, #67 (implementado pero reabierto) |
| 64 | La IA debe categorizar los elementos en partidas | Sin asignar (commit directo a main) | CLOSED | Commit `3d6880c` (sin PR) |
| 65 | Agregar exportación a PDF al lado del botón "Descargar Excel" | Sin asignar (PR de vbgjptt89g-beep) | CLOSED | #66 |

**Conteo:** Abiertos: 1 (#63). Cerrados: 30. Míos (tú): #8,#9,#11,#12,#13,#14,#16 → 7 cerrados, 0 abiertos. De tu compañero: #5,#7,#10,#15 → 4 cerrados, 0 abiertos. GitHub no tiene assignees; el responsable indicado es el reparto acordado o quien implementó el PR/commit.

## PRs abiertos y ramas con trabajo pendiente
- **PRs abiertos:** 0. Todos los PRs (#1,#3,#4,#6,#17-#31,#37-#47,#54-#57,#66-#72) están **MERGED**.
- **CI/Vercel:** Los PRs mergeados pasaron verificaciones en el flujo (tests/build). No hay PRs pendientes.
- **Ramas locales no mergeadas a main:** Ninguna.
- **Ramas remotas no mergeadas a main:** Ninguna (tras `fetch --prune`, solo quedan ramas mergeadas o `main`).
- **Ramas mergeadas (candidatas a borrar):** Local `issue-32-buscador-equipos` (merged). Remotas: `origin/feat/aprobador-y-login`, `origin/feat/despliegue-vercel`, `origin/feat/issue-32-buscador-scroll`, `origin/issue-11-espaciado`, `origin/issue-12-choice-box`, `origin/issue-13-usuarios-responsive`, `origin/issue-14-confirmar-salir`, `origin/issue-16-sin-seleccion`, `origin/issue-8-componentes-inputs`, `origin/issue-9-combobox-partidas`. Todas unidas a main.
- **Trabajo sin unir:** Ninguno detectado.

## Qué funciona y está publicado
- **App publicada:** https://presupuestos-grupo-comidas.vercel.app abre correctamente (login).  
- **Commit publicado (main):** `0765957` — "fix: busqueda rapida, modal estable, temas visibles y boton del catalogo junto a filtros (#72)". Últimos merges: #72, #71, #70, #69, #68, #67, #66, #57, #56, #55.  
- **Funcional:** Presupuestos (partidas/alternativas/elegir/marcar listo/reabrir/Excel), catálogo con buscador/paginación/acciones en lote/fusión, subida de cotizaciones con extracción IA (OpenRouter), roles/permisos, archivos privados (Vercel Blob/UploadThing/S3/local), navegación responsive, atajos globales (Ctrl/Cmd+K), command palette con temas, etc.  
- **Pruebas:** `npm test` → **24 pruebas en 5 archivos, todas pasan**.  
- **Build:** `npm run build` → **compila y genera páginas correctamente**.  
- **Base local (actual):** Postgres local en puerto **5433**, DB **postgres**, **3 migraciones aplicadas** (`0000_inicial`, `0001_almacenamiento_archivos`, `0002_rare_sumo`). Columnas esperadas presentes: `archivos.almacenamiento`, `equipos.creado_por`. **10 tablas públicas**.

## Problemas encontrados y recomendación
| Problema | Severidad | Recomendación |
|----------|-----------|---------------|
| **#63 abierto sin cerrar** (reabierto por José sin comentario tras #66/#67). | Media | Verificar por qué se reabrió. Columnas creadas/actualizadas por ahora se muestran (`createdBy/updatedAt`); `creadoPor` puede ser `null` para equipos creados por IA/antiguos → se muestra "Desconocido". Si eso es aceptable, cerrar issue. Si falta mostrar nombre para casos específicos, ajustar `listarEquipos`/UI. |
| **Cambios directos a main sin PR**: commits `63e812c`, `c276943`, `e3ab797`, `019040c`, `3d6880c`, `69010bf`, `ae10d36` (y merge sin revisión formal para algunos). Cerraron issues #53,#58,#60,#62,#64 sin PR. | Media | Seguir política estricta: todo a `main` vía PR con revisión. Documentar excepciones o convertir en PR retroactivo. |
| **Issues cerrados sin PR**: #48 (cerrado manual, luego #55 integra UploadThing), #49, #50 (sin PR identificable). | Media | Mejorar trazabilidad: usar `Closes #N` en español o inglés, o vincular commits/PRs. No es bloqueante. |
| **PR #66 usó "Cierra" (español)**: GitHub no lo detectó como cierre automático; #63 quedó abierto hasta que fue cerrado/reabierto manualmente. | Media | Usar palabras clave en inglés (`Closes/Fixes/Resolves`) para auto-cierre. |
| **Docs desactualizadas vs entorno actual**: README/CLAUDE dicen `.env` apunta a Neon branch `desarrollo`, pero `.env` actual apunta a Postgres **local** (puerto 5433). También README dice "tests usan Postgres temporal" pero `tests/ayuda.ts` usa **PGlite**. | Media | Actualizar README/CLAUDE para reflejar realidad (o revertir `.env` a Neon). No cambiar `.env` sin acuerdo. |
| **Migraciones no verificables en Neon**: no hay `.env.respaldo-produccion` ni credenciales para consultar producción; solo se verificó local (3/3 aplicadas). | Media | Confirmar migraciones en Neon `desarrollo` y en `production` desde ambiente autorizado (Vercel/Neon). El proyecto tiene `drizzle` listo. |
| **Vulnerabilidades npm**: `npm install` reporta **10 vulnerabilidades (6 moderadas, 4 altas)**. | Baja | Ejecutar `npm audit` para revisar, aplicar fixes con cuidado (puede haber breaking changes). No urgente si no afecta build/tests. |
| **Advertencia Better Auth secret baja entropía** (solo local). | Baja | Usar secret fuerte en producción/Vercel (ya configurado ahí?). Verificar en Vercel, no tocar desde repo. |

## Siguientes pasos para mí y para mi compañero, en orden
### Para ti (Carlos)
1. **Verificar #63**: Entrar a catálogo y confirmar columnas "Creado por/Creado el/Actualizado el". Si equipo creado por IA/antiguo muestra "Desconocido", decidir si aceptar o ajustar. Si está correcto, **cerrar #63** (o pedir a José que lo cierre).  
2. **Confirmar migraciones en Neon**: Aplicar/verificar migraciones en branch **desarrollo** de Neon y luego en **producción** si hay cambios pendientes. Usar `npm run db:migrate` con URL correspondiente.  
3. **Revisar entorno de publicación**: Verificar variables en Vercel (especialmente `ARCHIVOS_STORAGE`, credenciales blob/uploadthing/s3) y que el despliegue de `0765957` esté correcto.  
4. **Limpiar ramas**: Borrar ramas mergeadas (local `issue-32-buscador-equipos` y remotas listadas arriba). Ya hecho por este script si deseas, o manual.  
5. **Seguir proceso**: Usar PRs para todo lo futuro; usar palabras clave en inglés para cierre automático de issues.

### Para tu compañero (José)
1. **Explicar/cerrar #63**: Si lo reabrió por algún detalle, comentar y cerrar o proponer ajuste.  
2. **Alinear trazabilidad**: Vincular issues con PRs usando `Closes #N` en inglés, o evitar cerrar issues sin PR/commit vinculado.  
3. **Coordinar migraciones**: Si toca esquema, hacerlo con migración y coordinar con Carlos (uno a la vez).  
4. **Seguir flujo**: Continuar trabajando en ramas `feat/...` con PR a `main`.

## Para Claude Code
**Cómo retomar el trabajo sin investigar desde cero:**
1. **Leer primero:** `README.md`, `CLAUDE.md`, `AGENTS.md`, `ESTADO.md` (este archivo), `package.json`.  
2. **Estado actual:** `main` en `0765957`, limpio, sin PRs abiertos. Issue abierto: **#63** (reabierto).  
3. **Reglas clave:** Toda regla de negocio/permisos va en `src/lib/datos.ts`. Roles `admin/creador/aprobador` (usar helpers, no comparar role directo). Montos en centavos. Un archivo subido visible solo por `/api/archivos/[id]` con permisos.  
4. **Arquitectura:** Next.js 16 App Router, `proxy.ts` (no middleware), `params` son `Promise`. Server actions con zod, respuestas `{ok,error}`. Componentes en `src/components/campos/`. Tests usan **PGlite** (`tests/ayuda.ts`).  
5. **Almacenamiento:** Soporta `local`/`blob`/`uploadthing`/`s3` (`src/lib/archivos.ts`, `src/lib/limites.ts`). `maxDuration=300` en extracción.  
6. **Catálogo:** Columnas `creado por/creado el/actualizado el` implementadas (`TablaEquipos.tsx`, `listarEquipos` con join a `user`). Equipos creados por IA quedan `revisado=false`.  
7. **Búsqueda global:** Command palette con atajos Ctrl/Cmd+K, búsqueda directa a BD (`buscarGlobal`), temas claro/oscuro/sistema.  

**Qué NO tocar:**
- `.env` y `.env.respaldo-produccion` (nunca mostrar/subir).  
- Variables de Vercel ni correo Git.  
- Puerto **3000** (app ajena).  
- No cambiar código sin motivo; esta revisión es solo informativa.  
- No hacer migraciones sin coordinar; aplicar primero en Neon `desarrollo`, después en `production`.  
- No cerrar issues masivamente; respetar trazabilidad.  
- No borrar nada fuera de las ramas mergeadas listadas.
