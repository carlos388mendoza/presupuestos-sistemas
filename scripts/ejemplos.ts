import "./env";
import { eq } from "drizzle-orm";
import { crearDb } from "../src/db/cliente";
import { ejemploCafeteriaLaCeiba } from "../src/lib/ejemplo-cafeteria";
import { alternativas, itemsAlternativa, partidas, presupuestos, user } from "../src/db/schema";

type Ejemplo = {
  id: string;
  nombre: string;
  restaurante: string;
  tipo: "apertura" | "remodelacion";
  estado: "borrador" | "listo";
  notas: string;
  partidas: {
    id: string;
    nombre: string;
    alternativas: {
      id: string;
      proveedor: string;
      tipoCompra: "nacional" | "internacional";
      elegida: boolean;
      notas: string;
      items: { descripcion: string; cantidad: number; precioUnitarioCentavos: number; moneda: "USD" | "HNL" }[];
    }[];
  }[];
};

const ejemplos: Ejemplo[] = [
  {
    id: "ejemplo-presupuesto-listo",
    nombre: "Ejemplo: apertura lista para exportar",
    restaurante: "Restaurante Demo · Tegucigalpa",
    tipo: "apertura",
    estado: "listo",
    notas: "Datos ficticios para demostrar un presupuesto completo. No son cotizaciones reales.",
    partidas: [
      {
        id: "ejemplo-listo-red",
        nombre: "Red y cableado",
        alternativas: [
          {
            id: "ejemplo-listo-red-elegida",
            proveedor: "Netcom Honduras (ejemplo)",
            tipoCompra: "nacional",
            elegida: true,
            notas: "Opción elegida en este ejemplo.",
            items: [
              { descripcion: "Switch administrable PoE de 24 puertos", cantidad: 1, precioUnitarioCentavos: 4850000, moneda: "HNL" },
              { descripcion: "Punto de red Cat 6 instalado", cantidad: 12, precioUnitarioCentavos: 185000, moneda: "HNL" },
            ],
          },
          {
            id: "ejemplo-listo-red-opcion",
            proveedor: "Importadora Digital (ejemplo)",
            tipoCompra: "internacional",
            elegida: false,
            notas: "Alternativa sin elegir.",
            items: [{ descripcion: "Switch administrable PoE de 24 puertos", cantidad: 1, precioUnitarioCentavos: 97500, moneda: "USD" }],
          },
        ],
      },
      {
        id: "ejemplo-listo-pos",
        nombre: "Puntos de venta",
        alternativas: [
          {
            id: "ejemplo-listo-pos-elegida",
            proveedor: "Soluciones POS (ejemplo)",
            tipoCompra: "nacional",
            elegida: true,
            notas: "Opción elegida en este ejemplo.",
            items: [
              { descripcion: "Terminal punto de venta", cantidad: 2, precioUnitarioCentavos: 3290000, moneda: "HNL" },
              { descripcion: "Impresora térmica de recibos", cantidad: 2, precioUnitarioCentavos: 685000, moneda: "HNL" },
            ],
          },
          {
            id: "ejemplo-listo-pos-opcion",
            proveedor: "Retail Tech (ejemplo)",
            tipoCompra: "internacional",
            elegida: false,
            notas: "Alternativa sin elegir.",
            items: [{ descripcion: "Terminal punto de venta", cantidad: 2, precioUnitarioCentavos: 155000, moneda: "USD" }],
          },
        ],
      },
      {
        id: "ejemplo-listo-seguridad",
        nombre: "Cámaras y grabación",
        alternativas: [
          {
            id: "ejemplo-listo-seguridad-elegida",
            proveedor: "CamSecure (ejemplo)",
            tipoCompra: "internacional",
            elegida: true,
            notas: "Opción elegida en este ejemplo.",
            items: [
              { descripcion: "Cámara IP PoE", cantidad: 8, precioUnitarioCentavos: 13900, moneda: "USD" },
              { descripcion: "Grabador NVR de 16 canales", cantidad: 1, precioUnitarioCentavos: 62500, moneda: "USD" },
            ],
          },
          {
            id: "ejemplo-listo-seguridad-opcion",
            proveedor: "Seguridad Centro (ejemplo)",
            tipoCompra: "nacional",
            elegida: false,
            notas: "Alternativa sin elegir.",
            items: [{ descripcion: "Sistema de cámaras instalado", cantidad: 1, precioUnitarioCentavos: 11150000, moneda: "HNL" }],
          },
        ],
      },
    ],
  },
  {
    id: "ejemplo-presupuesto-borrador",
    nombre: "Ejemplo: presupuesto en preparación",
    restaurante: "Restaurante Demo · San Pedro Sula",
    tipo: "remodelacion",
    estado: "borrador",
    notas: "Datos ficticios. Hay alternativas pendientes de elegir en varias partidas.",
    partidas: [
      {
        id: "ejemplo-borrador-red",
        nombre: "Mejora de red",
        alternativas: [
          {
            id: "ejemplo-borrador-red-a",
            proveedor: "Netcom Honduras (ejemplo)",
            tipoCompra: "nacional",
            elegida: false,
            notas: "Pendiente de decisión.",
            items: [{ descripcion: "Access point Wi-Fi", cantidad: 4, precioUnitarioCentavos: 745000, moneda: "HNL" }],
          },
          {
            id: "ejemplo-borrador-red-b",
            proveedor: "Importadora Digital (ejemplo)",
            tipoCompra: "internacional",
            elegida: false,
            notas: "Pendiente de decisión.",
            items: [{ descripcion: "Access point Wi-Fi", cantidad: 4, precioUnitarioCentavos: 21500, moneda: "USD" }],
          },
        ],
      },
      {
        id: "ejemplo-borrador-pos",
        nombre: "Punto de venta adicional",
        alternativas: [
          {
            id: "ejemplo-borrador-pos-elegida",
            proveedor: "Soluciones POS (ejemplo)",
            tipoCompra: "nacional",
            elegida: true,
            notas: "Elegida; todavía faltan otras partidas.",
            items: [
              { descripcion: "Terminal punto de venta", cantidad: 1, precioUnitarioCentavos: 3460000, moneda: "HNL" },
              { descripcion: "Gaveta de dinero", cantidad: 1, precioUnitarioCentavos: 825000, moneda: "HNL" },
            ],
          },
          {
            id: "ejemplo-borrador-pos-opcion",
            proveedor: "Retail Tech (ejemplo)",
            tipoCompra: "internacional",
            elegida: false,
            notas: "Alternativa sin elegir.",
            items: [{ descripcion: "Terminal punto de venta", cantidad: 1, precioUnitarioCentavos: 149000, moneda: "USD" }],
          },
        ],
      },
      {
        id: "ejemplo-borrador-cocina",
        nombre: "Pantallas de cocina",
        alternativas: [
          {
            id: "ejemplo-borrador-cocina-a",
            proveedor: "Pantallas HN (ejemplo)",
            tipoCompra: "nacional",
            elegida: false,
            notas: "Pendiente de decisión.",
            items: [{ descripcion: "Pantalla de cocina (KDS)", cantidad: 2, precioUnitarioCentavos: 2180000, moneda: "HNL" }],
          },
          {
            id: "ejemplo-borrador-cocina-b",
            proveedor: "Kitchen Systems (ejemplo)",
            tipoCompra: "internacional",
            elegida: false,
            notas: "Pendiente de decisión.",
            items: [{ descripcion: "Pantalla de cocina (KDS)", cantidad: 2, precioUnitarioCentavos: 68000, moneda: "USD" }],
          },
        ],
      },
    ],
  },
  ejemploCafeteriaLaCeiba,
];

function urlDeDesarrollo(): string {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL || process.env.VERCEL_ENV) {
    throw new Error("Este comando no se puede ejecutar en producción ni en Vercel.");
  }
  if (process.env.DATABASE_BRANCH !== "desarrollo") {
    throw new Error("Confirma la branch local de Neon con DATABASE_BRANCH=desarrollo antes de cargar ejemplos.");
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL; no se conectó a ninguna base de datos.");
  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "postgresql:") throw new Error();
    host = parsed.hostname.toLowerCase();
  } catch {
    throw new Error("DATABASE_URL no parece ser una conexión válida de Neon; no se conectó a ninguna base de datos.");
  }
  if (!host.endsWith(".neon.tech")) {
    throw new Error("Solo se permiten branches de desarrollo de Neon; no se conectó a la base de datos.");
  }
  return url;
}

async function main() {
  let db: ReturnType<typeof crearDb> | undefined;
  try {
    db = crearDb(urlDeDesarrollo());
    const [admin] = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin")).limit(1);
    if (!admin) throw new Error("Primero crea el administrador con npm run setup.");

    await db.transaction(async (tx) => {
      for (const ejemplo of ejemplos) {
        await tx
          .insert(presupuestos)
          .values({
            id: ejemplo.id,
            nombre: ejemplo.nombre,
            restaurante: ejemplo.restaurante,
            tipo: ejemplo.tipo,
            estado: ejemplo.estado,
            notas: ejemplo.notas,
            creadoPor: admin.id,
          })
          .onConflictDoNothing({ target: presupuestos.id });

        for (const partida of ejemplo.partidas) {
          await tx
            .insert(partidas)
            .values({ id: partida.id, presupuestoId: ejemplo.id, nombre: partida.nombre })
            .onConflictDoNothing({ target: partidas.id });

          for (const alternativa of partida.alternativas) {
            await tx
              .insert(alternativas)
              .values({
                id: alternativa.id,
                partidaId: partida.id,
                proveedor: alternativa.proveedor,
                tipoCompra: alternativa.tipoCompra,
                elegida: alternativa.elegida,
                notas: alternativa.notas,
              })
              .onConflictDoNothing({ target: alternativas.id });

            await tx
              .insert(itemsAlternativa)
              .values(
                alternativa.items.map((item, orden) => ({
                  id: `${alternativa.id}-item-${orden + 1}`,
                  alternativaId: alternativa.id,
                  equipoId: null,
                  descripcion: item.descripcion,
                  cantidad: item.cantidad,
                  precioUnitarioCentavos: item.precioUnitarioCentavos,
                  moneda: item.moneda,
                  orden,
                })),
              )
              .onConflictDoNothing({ target: itemsAlternativa.id });
          }
        }
      }
    });
    console.log("Presupuestos de ejemplo cargados. Si vuelves a correr este comando, no se duplican.");
  } catch (error) {
    console.error("No se cargaron los ejemplos:", error instanceof Error ? error.message : "error desconocido");
    process.exitCode = 1;
  } finally {
    await db?.cerrar();
  }
}

void main();
