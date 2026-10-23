import type { Moneda, TipoCompra } from "@/db/schema";

export const MONEDAS: Moneda[] = ["USD", "HNL"];

export type TotalesPorMoneda = Record<Moneda, number>; // en centavos

export const totalesVacios = (): TotalesPorMoneda => ({ USD: 0, HNL: 0 });

/** Precio unitario máximo que admite la columna `precio_unitario_centavos` (entero de 32 bits). */
export const MAXIMO_CENTAVOS = 2_147_483_647;

// n * 100 en coma flotante puede quedar justo debajo de .5 (1.005 * 100 = 100.4999…);
// se redondea primero a 15 cifras significativas para obtener el centavo correcto.
const multiplicarPor100 = (n: number) => Math.round(Number((n * 100).toPrecision(15)));

/** Convierte un texto como "1,234.50" a centavos enteros. Devuelve null si no es válido. */
export function aCentavos(valor: string | number): number | null {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? multiplicarPor100(valor) : null;
  }
  const limpio = valor.replace(/[\s,]/g, "").replace(/^(L|\$|USD|HNL)/i, "");
  if (limpio === "" || !/^-?\d*(\.\d+)?$/.test(limpio)) return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? multiplicarPor100(n) : null;
}

/** Centavos a texto editable, sin separadores de miles: 123450 -> "1234.50" */
export function centavosATexto(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

const formatos: Record<Moneda, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  HNL: new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
};

export const SIMBOLO: Record<Moneda, string> = { USD: "$", HNL: "L" };

/** 123450, "HNL" -> "L 1,234.50" */
export function formatear(centavos: number, moneda: Moneda): string {
  return `${SIMBOLO[moneda]} ${formatos[moneda].format(centavos / 100)}`;
}

export function subtotalItem(cantidad: number, precioUnitarioCentavos: number): number {
  return Math.round(cantidad * precioUnitarioCentavos);
}

type ItemConMonto = { cantidad: number; precioUnitarioCentavos: number; moneda: Moneda };

/** Suma ítems por moneda. Nunca convierte entre monedas. */
export function totalesDeItems(items: ItemConMonto[]): TotalesPorMoneda {
  const t = totalesVacios();
  for (const it of items) t[it.moneda] += subtotalItem(it.cantidad, it.precioUnitarioCentavos);
  return t;
}

export function sumarTotales(a: TotalesPorMoneda, b: TotalesPorMoneda): TotalesPorMoneda {
  return { USD: a.USD + b.USD, HNL: a.HNL + b.HNL };
}

type AlternativaParaTotal = {
  elegida: boolean;
  tipoCompra: TipoCompra;
  items: ItemConMonto[];
};

export type ResumenPresupuesto = {
  total: TotalesPorMoneda;
  nacional: TotalesPorMoneda;
  internacional: TotalesPorMoneda;
};

/** Totales del presupuesto: solo cuentan las alternativas elegidas. */
export function resumenPresupuesto(partidas: { alternativas: AlternativaParaTotal[] }[]): ResumenPresupuesto {
  const r: ResumenPresupuesto = {
    total: totalesVacios(),
    nacional: totalesVacios(),
    internacional: totalesVacios(),
  };
  for (const p of partidas) {
    for (const a of p.alternativas) {
      if (!a.elegida) continue;
      const t = totalesDeItems(a.items);
      r.total = sumarTotales(r.total, t);
      r[a.tipoCompra] = sumarTotales(r[a.tipoCompra], t);
    }
  }
  return r;
}
