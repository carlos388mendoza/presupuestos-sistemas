/**
 * Capa de acceso a datos. Todas las reglas de permisos y de negocio viven aquí,
 * para que páginas, acciones y APIs no puedan saltárselas.
 * Recibe `db` como parámetro para poder probarse con una base de prueba.
 */
import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import type { DB } from "@/db/cliente";
import {
  alternativas,
  archivos,
  equipos,
  itemsAlternativa,
  partidas,
  presupuestos,
  user,
  type Moneda,
  type Rol,
  type TipoCompra,
} from "@/db/schema";
import { MAXIMO_CENTAVOS, resumenPresupuesto, totalesDeItems } from "./dinero";

export type Actor = { id: string; role: Rol };

export class ErrorNegocio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorNegocio";
  }
}

const NO_ENCONTRADO = "No se encontró el presupuesto o no tienes acceso a él.";

/* ------------------------------------------------------------------ */
/* Permisos                                                            */
/* ------------------------------------------------------------------ */

/*
 * Roles:
 * - admin: ve y modifica todo; maneja usuarios.
 * - creador: ve y modifica solo sus presupuestos.
 * - aprobador: ve todos los presupuestos, elige alternativas, marca listo/reabre
 *   y descarga el Excel; no crea ni modifica presupuestos, partidas ni alternativas.
 */

export const NOMBRES_ROL: Record<Rol, string> = {
  admin: "Administrador",
  creador: "Creador de presupuestos",
  aprobador: "Aprobador de presupuestos",
};

const SOLO_APROBAR = "Tu rol solo permite elegir alternativas y marcar presupuestos como listos.";

/** Ve los presupuestos de todo el departamento. */
export function puedeVerTodo(actor: Actor): boolean {
  return actor.role === "admin" || actor.role === "aprobador";
}

export function puedeManejarUsuarios(actor: Actor): boolean {
  return actor.role === "admin";
}

/** Crear presupuestos y subir cotizaciones. */
export function puedeCrearPresupuestos(actor: Actor): boolean {
  return actor.role !== "aprobador";
}

export function puedeAcceder(actor: Actor, creadoPor: string): boolean {
  return puedeVerTodo(actor) || actor.id === creadoPor;
}

/** Qué puede hacer el actor con un presupuesto que ya puede ver. */
export function permisosPresupuesto(actor: Actor, creadoPor: string) {
  const esDuenoOAdmin = actor.role === "admin" || actor.id === creadoPor;
  return {
    /** Editar datos, partidas y alternativas, o eliminar. */
    modificar: esDuenoOAdmin,
    /** Elegir alternativas y marcar listo / reabrir. */
    decidir: esDuenoOAdmin || actor.role === "aprobador",
  };
}

/** Devuelve el presupuesto si el actor puede verlo; si no, lanza error. */
export async function presupuestoAccesible(db: DB, actor: Actor, presupuestoId: string) {
  const [p] = await db.select().from(presupuestos).where(eq(presupuestos.id, presupuestoId));
  if (!p || !puedeAcceder(actor, p.creadoPor)) throw new ErrorNegocio(NO_ENCONTRADO);
  return p;
}

async function presupuestoConPermiso(db: DB, actor: Actor, presupuestoId: string, permiso: "modificar" | "decidir") {
  const p = await presupuestoAccesible(db, actor, presupuestoId);
  if (!permisosPresupuesto(actor, p.creadoPor)[permiso]) throw new ErrorNegocio(SOLO_APROBAR);
  return p;
}

async function presupuestoEditable(
  db: DB,
  actor: Actor,
  presupuestoId: string,
  permiso: "modificar" | "decidir" = "modificar",
) {
  const p = await presupuestoConPermiso(db, actor, presupuestoId, permiso);
  if (p.estado === "listo") {
    throw new ErrorNegocio("El presupuesto está marcado como listo. Reábrelo para hacer cambios.");
  }
  return p;
}

async function partidaAccesible(db: DB, actor: Actor, partidaId: string) {
  const [pa] = await db.select().from(partidas).where(eq(partidas.id, partidaId));
  if (!pa) throw new ErrorNegocio("No se encontró la partida.");
  const p = await presupuestoAccesible(db, actor, pa.presupuestoId);
  return { partida: pa, presupuesto: p };
}

async function alternativaAccesible(db: DB, actor: Actor, alternativaId: string) {
  const [a] = await db.select().from(alternativas).where(eq(alternativas.id, alternativaId));
  if (!a) throw new ErrorNegocio("No se encontró la alternativa.");
  const { partida, presupuesto } = await partidaAccesible(db, actor, a.partidaId);
  return { alternativa: a, partida, presupuesto };
}

/* ------------------------------------------------------------------ */
/* Lectura                                                             */
/* ------------------------------------------------------------------ */

export async function listarPresupuestos(db: DB, actor: Actor) {
  const filas = await db
    .select({
      id: presupuestos.id,
      nombre: presupuestos.nombre,
      restaurante: presupuestos.restaurante,
      tipo: presupuestos.tipo,
      estado: presupuestos.estado,
      notas: presupuestos.notas,
      updatedAt: presupuestos.updatedAt,
      creadoPor: presupuestos.creadoPor,
      autor: user.name,
    })
    .from(presupuestos)
    .innerJoin(user, eq(user.id, presupuestos.creadoPor))
    .where(puedeVerTodo(actor) ? undefined : eq(presupuestos.creadoPor, actor.id))
    .orderBy(desc(presupuestos.updatedAt));

  return Promise.all(
    filas.map(async (f) => {
      const completo = await cargarDetalle(db, f.id);
      const textoBusqueda = [
        f.nombre, f.restaurante, f.tipo, f.estado, f.notas, f.autor,
        ...completo.partidas.flatMap((p) => [p.nombre, ...p.alternativas.flatMap((a) => [
          a.proveedor, a.notas, a.archivoNombre ?? "",
          ...a.items.flatMap((i) => [i.descripcion, i.equipoNombre ?? "", i.equipoMarca ?? "", i.equipoModelo ?? "", i.equipoDescripcion ?? "", i.equipoCategoria ?? ""]),
        ])]),
      ].join(" ").toLocaleLowerCase("es-HN");
      return { ...f, textoBusqueda, resumen: resumenPresupuesto(completo.partidas), partidas: completo.partidas.length };
    }),
  );
}

async function cargarDetalle(db: DB, presupuestoId: string) {
  const ps = await db
    .select()
    .from(partidas)
    .where(eq(partidas.presupuestoId, presupuestoId))
    .orderBy(asc(partidas.orden), asc(partidas.createdAt));
  const partidaIds = ps.map((p) => p.id);

  const alts = partidaIds.length
    ? await db
        .select({
          alternativa: alternativas,
          archivoNombre: archivos.nombreOriginal,
        })
        .from(alternativas)
        .leftJoin(archivos, eq(archivos.id, alternativas.archivoId))
        .where(inArray(alternativas.partidaId, partidaIds))
        .orderBy(asc(alternativas.createdAt))
    : [];
  const altIds = alts.map((a) => a.alternativa.id);

  const items = altIds.length
    ? await db
        .select({ item: itemsAlternativa, equipoNombre: equipos.nombre, equipoMarca: equipos.marca, equipoModelo: equipos.modelo, equipoDescripcion: equipos.descripcion, equipoCategoria: equipos.categoria })
        .from(itemsAlternativa)
        .leftJoin(equipos, eq(equipos.id, itemsAlternativa.equipoId))
        .where(inArray(itemsAlternativa.alternativaId, altIds))
        .orderBy(asc(itemsAlternativa.orden))
    : [];

  return {
    partidas: ps.map((p) => ({
      ...p,
      alternativas: alts
        .filter((a) => a.alternativa.partidaId === p.id)
        .map(({ alternativa, archivoNombre }) => {
          const its = items
            .filter((i) => i.item.alternativaId === alternativa.id)
          .map((i) => ({ ...i.item, equipoNombre: i.equipoNombre, equipoMarca: i.equipoMarca, equipoModelo: i.equipoModelo, equipoDescripcion: i.equipoDescripcion, equipoCategoria: i.equipoCategoria }));
          return { ...alternativa, archivoNombre, items: its, totales: totalesDeItems(its) };
        }),
    })),
  };
}

export async function obtenerPresupuesto(db: DB, actor: Actor, presupuestoId: string) {
  const p = await presupuestoAccesible(db, actor, presupuestoId);
  const [autor] = await db.select({ name: user.name }).from(user).where(eq(user.id, p.creadoPor));
  const detalle = await cargarDetalle(db, p.id);
  return {
    ...p,
    autor: autor?.name ?? "",
    partidas: detalle.partidas,
    resumen: resumenPresupuesto(detalle.partidas),
  };
}

export type PresupuestoCompleto = Awaited<ReturnType<typeof obtenerPresupuesto>>;

export async function obtenerAlternativa(db: DB, actor: Actor, alternativaId: string) {
  const { alternativa, partida, presupuesto } = await alternativaAccesible(db, actor, alternativaId);
  const items = await db
    .select()
    .from(itemsAlternativa)
    .where(eq(itemsAlternativa.alternativaId, alternativa.id))
    .orderBy(asc(itemsAlternativa.orden));
  const [archivo] = alternativa.archivoId
    ? await db.select().from(archivos).where(eq(archivos.id, alternativa.archivoId))
    : [];
  return { alternativa, partida, presupuesto, items, archivo };
}

/* ------------------------------------------------------------------ */
/* Presupuestos y partidas                                             */
/* ------------------------------------------------------------------ */

export async function crearPresupuesto(
  db: DB,
  actor: Actor,
  datos: { nombre: string; restaurante: string; tipo: "apertura" | "remodelacion"; notas?: string },
) {
  if (!puedeCrearPresupuestos(actor)) throw new ErrorNegocio(SOLO_APROBAR);
  const [fila] = await db
    .insert(presupuestos)
    .values({ ...datos, notas: datos.notas ?? "", creadoPor: actor.id })
    .returning();
  return fila;
}

export async function actualizarPresupuesto(
  db: DB,
  actor: Actor,
  id: string,
  datos: { nombre: string; restaurante: string; tipo: "apertura" | "remodelacion"; notas: string },
) {
  await presupuestoEditable(db, actor, id);
  await db.update(presupuestos).set(datos).where(eq(presupuestos.id, id));
}

export async function eliminarPresupuesto(db: DB, actor: Actor, id: string) {
  await presupuestoConPermiso(db, actor, id, "modificar");
  await db.delete(presupuestos).where(eq(presupuestos.id, id));
}

async function tocarPresupuesto(db: DB, id: string) {
  await db.update(presupuestos).set({ updatedAt: new Date() }).where(eq(presupuestos.id, id));
}

export async function crearPartida(db: DB, actor: Actor, presupuestoId: string, nombre: string) {
  await presupuestoEditable(db, actor, presupuestoId);
  const orden = (await db.select({ id: partidas.id }).from(partidas).where(eq(partidas.presupuestoId, presupuestoId))).length;
  const [fila] = await db.insert(partidas).values({ presupuestoId, nombre, orden }).returning();
  await tocarPresupuesto(db, presupuestoId);
  return fila;
}

export async function renombrarPartida(db: DB, actor: Actor, partidaId: string, nombre: string) {
  const { presupuesto } = await partidaAccesible(db, actor, partidaId);
  await presupuestoEditable(db, actor, presupuesto.id);
  await db.update(partidas).set({ nombre }).where(eq(partidas.id, partidaId));
}

export async function eliminarPartida(db: DB, actor: Actor, partidaId: string) {
  const { presupuesto } = await partidaAccesible(db, actor, partidaId);
  await presupuestoEditable(db, actor, presupuesto.id);
  await db.delete(partidas).where(eq(partidas.id, partidaId));
  await tocarPresupuesto(db, presupuesto.id);
}

/* ------------------------------------------------------------------ */
/* Alternativas                                                        */
/* ------------------------------------------------------------------ */

export type ItemEntrada = {
  equipoId: string | null;
  /** Si es true y no hay equipoId, se crea el equipo en el catálogo. */
  crearEquipo: boolean;
  origenEquipo: "manual" | "ia";
  descripcion: string;
  marca: string;
  modelo: string;
  cantidad: number;
  precioUnitarioCentavos: number;
  moneda: Moneda;
};

export type AlternativaEntrada = {
  id?: string;
  partidaId: string;
  proveedor: string;
  tipoCompra: TipoCompra;
  notas: string;
  archivoId: string | null;
  items: ItemEntrada[];
};

export const MENSAJE_PRECIO_MAXIMO = "Un precio unitario es demasiado alto (máximo 21,474,836.47).";

/** La base guarda el precio unitario como entero de 32 bits; un precio mayor la haría fallar. */
function validarPrecios(items: { precioUnitarioCentavos: number }[]) {
  if (items.some((it) => it.precioUnitarioCentavos > MAXIMO_CENTAVOS)) throw new ErrorNegocio(MENSAJE_PRECIO_MAXIMO);
}

export async function guardarAlternativa(db: DB, actor: Actor, entrada: AlternativaEntrada): Promise<string> {
  const { presupuesto } = await partidaAccesible(db, actor, entrada.partidaId);
  await presupuestoEditable(db, actor, presupuesto.id);

  if (entrada.items.length === 0) throw new ErrorNegocio("Agrega al menos un ítem a la alternativa.");
  validarPrecios(entrada.items);

  let archivoActual: string | null = null;
  if (entrada.id) {
    const { alternativa } = await alternativaAccesible(db, actor, entrada.id);
    if (alternativa.partidaId !== entrada.partidaId) throw new ErrorNegocio("La alternativa no pertenece a esa partida.");
    archivoActual = alternativa.archivoId;
  }

  // Se puede adjuntar un archivo propio (o cualquiera si es admin). Al editar, también se
  // puede conservar el que la alternativa ya tenía, aunque lo haya subido otra persona.
  if (entrada.archivoId && entrada.archivoId !== archivoActual) {
    const [archivo] = await db.select().from(archivos).where(eq(archivos.id, entrada.archivoId));
    if (!archivo || (archivo.subidoPor !== actor.id && actor.role !== "admin")) {
      throw new ErrorNegocio("El archivo de cotización no es válido.");
    }
  }

  return db.transaction(async (tx) => {
    let altId = entrada.id;
    const datos = {
      partidaId: entrada.partidaId,
      proveedor: entrada.proveedor,
      tipoCompra: entrada.tipoCompra,
      notas: entrada.notas,
      archivoId: entrada.archivoId,
    };
    if (altId) {
      await tx.update(alternativas).set(datos).where(eq(alternativas.id, altId));
      await tx.delete(itemsAlternativa).where(eq(itemsAlternativa.alternativaId, altId));
    } else {
      const [nueva] = await tx.insert(alternativas).values(datos).returning({ id: alternativas.id });
      altId = nueva.id;
    }

    for (const [i, it] of entrada.items.entries()) {
      let equipoId = it.equipoId;
      if (equipoId) {
        const [existe] = await tx.select({ id: equipos.id }).from(equipos).where(eq(equipos.id, equipoId));
        if (!existe) equipoId = null;
      }
      if (!equipoId && it.crearEquipo) {
        const [creado] = await tx
          .insert(equipos)
          .values({
            nombre: it.descripcion,
            marca: it.marca,
            modelo: it.modelo,
            origen: it.origenEquipo,
            creadoPor: actor.id,
            // Los creados por la IA quedan pendientes de revisión
            revisado: it.origenEquipo === "manual",
          })
          .returning({ id: equipos.id });
        equipoId = creado.id;
      }
      await tx.insert(itemsAlternativa)
        .values({
          alternativaId: altId!,
          equipoId,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precioUnitarioCentavos: it.precioUnitarioCentavos,
          moneda: it.moneda,
          orden: i,
        });
    }

    await tx.update(presupuestos).set({ updatedAt: new Date() }).where(eq(presupuestos.id, presupuesto.id));
    return altId!;
  });
}

export type AlternativaAgrupadaEntrada = Omit<AlternativaEntrada, "partidaId"> & { partidaId: string };

/** Guarda las alternativas clasificadas de una cotización en una sola transacción. */
export async function guardarAlternativasAgrupadas(
  db: DB,
  actor: Actor,
  presupuestoId: string,
  entradas: AlternativaAgrupadaEntrada[],
): Promise<void> {
  const presupuesto = await presupuestoEditable(db, actor, presupuestoId);
  if (entradas.length === 0) throw new ErrorNegocio("No hay partidas con ítems para guardar.");
  const partidasPresupuesto = await db.select({ id: partidas.id }).from(partidas).where(eq(partidas.presupuestoId, presupuesto.id));
  const idsValidos = new Set(partidasPresupuesto.map((partida) => partida.id));
  for (const entrada of entradas) {
    if (!idsValidos.has(entrada.partidaId)) throw new ErrorNegocio("Una partida no pertenece a este presupuesto.");
    if (entrada.items.length === 0) throw new ErrorNegocio("Cada alternativa debe tener al menos un ítem.");
    validarPrecios(entrada.items);
  }
  if (entradas.some((entrada) => entrada.archivoId !== entradas[0]?.archivoId)) {
    throw new ErrorNegocio("Las alternativas deben usar el mismo archivo de cotización.");
  }
  const archivoId = entradas[0]!.archivoId;
  if (archivoId) {
    const [archivo] = await db.select().from(archivos).where(eq(archivos.id, archivoId));
    if (!archivo || (archivo.subidoPor !== actor.id && actor.role !== "admin")) {
      throw new ErrorNegocio("El archivo de cotización no es válido.");
    }
  }

  await db.transaction(async (tx) => {
    for (const entrada of entradas) {
      const [alternativa] = await tx.insert(alternativas).values({
        partidaId: entrada.partidaId,
        proveedor: entrada.proveedor,
        tipoCompra: entrada.tipoCompra,
        notas: entrada.notas,
        archivoId: entrada.archivoId,
      }).returning({ id: alternativas.id });
      for (const [orden, item] of entrada.items.entries()) {
        let equipoId = item.equipoId;
        if (equipoId) {
          const [existe] = await tx.select({ id: equipos.id }).from(equipos).where(eq(equipos.id, equipoId));
          if (!existe) equipoId = null;
        }
        if (!equipoId && item.crearEquipo) {
          const [creado] = await tx.insert(equipos).values({
            nombre: item.descripcion,
            marca: item.marca,
            modelo: item.modelo,
            origen: item.origenEquipo,
            creadoPor: actor.id,
            revisado: item.origenEquipo === "manual",
          }).returning({ id: equipos.id });
          equipoId = creado.id;
        }
        await tx.insert(itemsAlternativa).values({
          alternativaId: alternativa.id,
          equipoId,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitarioCentavos: item.precioUnitarioCentavos,
          moneda: item.moneda,
          orden,
        });
      }
    }
    await tx.update(presupuestos).set({ updatedAt: new Date() }).where(eq(presupuestos.id, presupuesto.id));
  });
}

export async function eliminarAlternativa(db: DB, actor: Actor, alternativaId: string) {
  const { presupuesto } = await alternativaAccesible(db, actor, alternativaId);
  await presupuestoEditable(db, actor, presupuesto.id);
  await db.delete(alternativas).where(eq(alternativas.id, alternativaId));
  await tocarPresupuesto(db, presupuesto.id);
}

/** Marca una alternativa como la elegida de su partida (y desmarca las demás). */
export async function elegirAlternativa(db: DB, actor: Actor, alternativaId: string) {
  const { alternativa, presupuesto } = await alternativaAccesible(db, actor, alternativaId);
  await presupuestoEditable(db, actor, presupuesto.id, "decidir");
  await db.transaction(async (tx) => {
    await tx
      .update(alternativas)
      .set({ elegida: false })
      .where(and(eq(alternativas.partidaId, alternativa.partidaId), eq(alternativas.elegida, true)));
    await tx.update(alternativas).set({ elegida: true }).where(eq(alternativas.id, alternativaId));
    await tx.update(presupuestos).set({ updatedAt: new Date() }).where(eq(presupuestos.id, presupuesto.id));
  });
}

export async function quitarEleccion(db: DB, actor: Actor, alternativaId: string) {
  const { presupuesto } = await alternativaAccesible(db, actor, alternativaId);
  await presupuestoEditable(db, actor, presupuesto.id, "decidir");
  await db.update(alternativas).set({ elegida: false }).where(eq(alternativas.id, alternativaId));
  await tocarPresupuesto(db, presupuesto.id);
}

/* ------------------------------------------------------------------ */
/* Estado                                                              */
/* ------------------------------------------------------------------ */

export function pendientesParaListo(p: Pick<PresupuestoCompleto, "partidas">): string[] {
  if (p.partidas.length === 0) return ["Agrega al menos una partida."];
  return p.partidas
    .filter((pa) => !pa.alternativas.some((a) => a.elegida))
    .map((pa) => `Elige una alternativa en "${pa.nombre}".`);
}

export async function marcarListo(db: DB, actor: Actor, presupuestoId: string) {
  await presupuestoConPermiso(db, actor, presupuestoId, "decidir");
  const completo = await obtenerPresupuesto(db, actor, presupuestoId);
  const pendientes = pendientesParaListo(completo);
  if (pendientes.length) throw new ErrorNegocio(pendientes.join(" "));
  await db.update(presupuestos).set({ estado: "listo" }).where(eq(presupuestos.id, presupuestoId));
}

export async function reabrir(db: DB, actor: Actor, presupuestoId: string) {
  await presupuestoConPermiso(db, actor, presupuestoId, "decidir");
  await db.update(presupuestos).set({ estado: "borrador" }).where(eq(presupuestos.id, presupuestoId));
}

/* ------------------------------------------------------------------ */
/* Archivos                                                            */
/* ------------------------------------------------------------------ */

/**
 * Un archivo se puede ver si lo subió el actor, si es admin o si es dueño del presupuesto que lo usa.
 * El aprobador ve las cotizaciones que ya están en algún presupuesto (las necesita para decidir).
 */
/* ------------------------------------------------------------------ */
/* Búsqueda global                                                    */
/* ------------------------------------------------------------------ */

export type ResultadoBusquedaGlobal = {
  presupuestos: { id: string; nombre: string; restaurante: string; estado: string; autor: string }[];
  equipos: { id: string; nombre: string; marca: string; modelo: string; categoria: string; revisado: boolean }[];
  usuarios: { id: string; name: string; email: string; role: string }[];
};

export async function buscarGlobal(db: DB, actor: Actor, consulta: string): Promise<ResultadoBusquedaGlobal> {
  const q = consulta.trim();
  const patron = `%${q}%`;

  const condicionesPresupuestos = [];
  if (!puedeVerTodo(actor)) condicionesPresupuestos.push(eq(presupuestos.creadoPor, actor.id));
  if (q) {
    condicionesPresupuestos.push(
      or(
        ilike(presupuestos.nombre, patron),
        ilike(presupuestos.restaurante, patron),
        ilike(presupuestos.tipo, patron),
        ilike(presupuestos.estado, patron),
        ilike(presupuestos.notas, patron),
        ilike(user.name, patron),
      ),
    );
  }

  const filasPresupuestos = await db
    .select({
      id: presupuestos.id,
      nombre: presupuestos.nombre,
      restaurante: presupuestos.restaurante,
      estado: presupuestos.estado,
      autor: user.name,
    })
    .from(presupuestos)
    .innerJoin(user, eq(user.id, presupuestos.creadoPor))
    .where(condicionesPresupuestos.length ? and(...condicionesPresupuestos) : undefined)
    .orderBy(desc(presupuestos.updatedAt))
    .limit(8);

  const condicionesEquipos = q
    ? [or(
        ilike(equipos.nombre, patron),
        ilike(equipos.marca, patron),
        ilike(equipos.modelo, patron),
        ilike(equipos.categoria, patron),
      )]
    : [];

  const filasEquipos = await db
    .select({
      id: equipos.id,
      nombre: equipos.nombre,
      marca: equipos.marca,
      modelo: equipos.modelo,
      categoria: equipos.categoria,
      revisado: equipos.revisado,
    })
    .from(equipos)
    .where(condicionesEquipos.length ? and(...condicionesEquipos) : undefined)
    .orderBy(asc(equipos.nombre))
    .limit(8);

  let usuarios: ResultadoBusquedaGlobal["usuarios"] = [];
  if (actor.role === "admin") {
    const condicionesUsuarios = q
      ? [or(ilike(user.name, patron), ilike(user.email, patron))]
      : [];
    usuarios = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role })
      .from(user)
      .where(condicionesUsuarios.length ? and(...condicionesUsuarios) : undefined)
      .orderBy(asc(user.name))
      .limit(8);
  }

  return { presupuestos: filasPresupuestos, equipos: filasEquipos, usuarios };
}

export async function puedeVerArchivo(db: DB, actor: Actor, archivoId: string): Promise<boolean> {
  const [a] = await db.select().from(archivos).where(eq(archivos.id, archivoId));
  if (!a) return false;
  if (actor.role === "admin" || a.subidoPor === actor.id) return true;
  const usos = await db
    .select({ creadoPor: presupuestos.creadoPor })
    .from(alternativas)
    .innerJoin(partidas, eq(partidas.id, alternativas.partidaId))
    .innerJoin(presupuestos, eq(presupuestos.id, partidas.presupuestoId))
    .where(eq(alternativas.archivoId, archivoId));
  return usos.some((u) => puedeAcceder(actor, u.creadoPor));
}
