import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const creadoEn = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const actualizadoEn = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ------------------------------------------------------------------ */
/* Tablas de Better-auth (no cambiar nombres de columnas)              */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: creadoEn(),
  updatedAt: actualizadoEn(),
  // Campos propios de la aplicación
  role: text("role", { enum: ["admin", "creador", "aprobador"] }).notNull().default("creador"),
  activo: boolean("activo").notNull().default(true),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: creadoEn(),
    updatedAt: actualizadoEn(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: creadoEn(),
    updatedAt: actualizadoEn(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: creadoEn(),
  updatedAt: actualizadoEn(),
});

/* ------------------------------------------------------------------ */
/* Catálogo de equipos                                                 */
/* ------------------------------------------------------------------ */

export const equipos = pgTable(
  "equipos",
  {
    id: id(),
    nombre: text("nombre").notNull(),
    marca: text("marca").notNull().default(""),
    modelo: text("modelo").notNull().default(""),
    descripcion: text("descripcion").notNull().default(""),
    categoria: text("categoria").notNull().default(""),
    // 'ia' = creado automáticamente desde una cotización
    origen: text("origen", { enum: ["manual", "ia"] }).notNull().default("manual"),
    revisado: boolean("revisado").notNull().default(true),
    createdAt: creadoEn(),
    updatedAt: actualizadoEn(),
  },
  (t) => [index("equipos_marca_modelo_idx").on(t.marca, t.modelo)],
);

/* ------------------------------------------------------------------ */
/* Archivos de cotización subidos                                      */
/* ------------------------------------------------------------------ */

export const archivos = pgTable("archivos", {
  id: id(),
  nombreOriginal: text("nombre_original").notNull(),
  nombreGuardado: text("nombre_guardado").notNull().unique(),
  almacenamiento: text("almacenamiento", { enum: ["local", "s3", "uploadthing", "blob"] }).notNull().default("local"),
  mime: text("mime").notNull(),
  tamano: integer("tamano").notNull(),
  subidoPor: text("subido_por")
    .notNull()
    .references(() => user.id),
  createdAt: creadoEn(),
});

/* ------------------------------------------------------------------ */
/* Presupuestos                                                        */
/* ------------------------------------------------------------------ */

export const presupuestos = pgTable(
  "presupuestos",
  {
    id: id(),
    nombre: text("nombre").notNull(),
    restaurante: text("restaurante").notNull(),
    tipo: text("tipo", { enum: ["apertura", "remodelacion"] }).notNull(),
    estado: text("estado", { enum: ["borrador", "listo"] }).notNull().default("borrador"),
    notas: text("notas").notNull().default(""),
    creadoPor: text("creado_por")
      .notNull()
      .references(() => user.id),
    createdAt: creadoEn(),
    updatedAt: actualizadoEn(),
  },
  (t) => [index("presupuestos_creado_por_idx").on(t.creadoPor)],
);

/** Una necesidad dentro del presupuesto (ej. "Red y cableado"). */
export const partidas = pgTable(
  "partidas",
  {
    id: id(),
    presupuestoId: text("presupuesto_id")
      .notNull()
      .references(() => presupuestos.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    orden: integer("orden").notNull().default(0),
    createdAt: creadoEn(),
  },
  (t) => [index("partidas_presupuesto_idx").on(t.presupuestoId)],
);

/** Opciones que compiten dentro de una partida; solo una puede estar elegida. */
export const alternativas = pgTable(
  "alternativas",
  {
    id: id(),
    partidaId: text("partida_id")
      .notNull()
      .references(() => partidas.id, { onDelete: "cascade" }),
    proveedor: text("proveedor").notNull(),
    tipoCompra: text("tipo_compra", { enum: ["nacional", "internacional"] }).notNull(),
    archivoId: text("archivo_id").references(() => archivos.id, { onDelete: "set null" }),
    notas: text("notas").notNull().default(""),
    elegida: boolean("elegida").notNull().default(false),
    createdAt: creadoEn(),
    updatedAt: actualizadoEn(),
  },
  (t) => [
    index("alternativas_partida_idx").on(t.partidaId),
    // Garantía en la base de datos: máximo una alternativa elegida por partida
    uniqueIndex("alternativas_una_elegida_idx")
      .on(t.partidaId)
      .where(sql`${t.elegida} = true`),
  ],
);

export const itemsAlternativa = pgTable(
  "items_alternativa",
  {
    id: id(),
    alternativaId: text("alternativa_id")
      .notNull()
      .references(() => alternativas.id, { onDelete: "cascade" }),
    equipoId: text("equipo_id").references(() => equipos.id, { onDelete: "set null" }),
    descripcion: text("descripcion").notNull(),
    cantidad: doublePrecision("cantidad").notNull(),
    // Montos siempre en centavos enteros para evitar errores de redondeo
    precioUnitarioCentavos: integer("precio_unitario_centavos").notNull(),
    moneda: text("moneda", { enum: ["USD", "HNL"] }).notNull(),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [index("items_alternativa_idx").on(t.alternativaId)],
);

export type Moneda = "USD" | "HNL";
export type TipoCompra = "nacional" | "internacional";
export type Rol = "admin" | "creador" | "aprobador";
