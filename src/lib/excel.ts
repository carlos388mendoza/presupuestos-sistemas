import ExcelJS from "exceljs";
import type { Moneda, TipoCompra } from "@/db/schema";
import type { PresupuestoCompleto } from "./datos";
import { subtotalItem, totalesVacios, type TotalesPorMoneda } from "./dinero";

const FORMATO: Record<Moneda, string> = {
  USD: '"$" #,##0.00',
  HNL: '"L" #,##0.00',
};

const TINTA = "FF1D2B3A";
const LINEA = "FFD3DAD7";
const FONDO_ENCABEZADO = "FFE8EDEB";

const TITULO_TIPO: Record<TipoCompra, string> = {
  nacional: "Compras nacionales",
  internacional: "Compras internacionales",
};

/** Genera el Excel del presupuesto con las alternativas elegidas. Totales separados por moneda. */
export async function generarExcel(p: PresupuestoCompleto): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Presupuestos Sistemas";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Presupuesto", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ showGridLines: false }],
  });

  hoja.columns = [
    { key: "partida", width: 24 },
    { key: "proveedor", width: 24 },
    { key: "descripcion", width: 42 },
    { key: "cantidad", width: 10 },
    { key: "moneda", width: 9 },
    { key: "precio", width: 16 },
    { key: "subtotal", width: 18 },
  ];

  // Encabezado
  hoja.mergeCells("A1:G1");
  const titulo = hoja.getCell("A1");
  titulo.value = `Presupuesto de Sistemas · ${p.nombre}`;
  titulo.font = { size: 16, bold: true, color: { argb: TINTA } };

  const datos: [string, string][] = [
    ["Restaurante", p.restaurante],
    ["Tipo", p.tipo === "apertura" ? "Apertura" : "Remodelación"],
    ["Elaborado por", p.autor],
    ["Fecha", new Date().toLocaleDateString("es-HN", { day: "2-digit", month: "long", year: "numeric" })],
  ];
  datos.forEach(([k, v], i) => {
    const fila = hoja.getRow(3 + i);
    fila.getCell(1).value = k;
    fila.getCell(1).font = { bold: true, color: { argb: TINTA } };
    fila.getCell(2).value = v;
  });
  if (p.notas) {
    const fila = hoja.getRow(7);
    fila.getCell(1).value = "Notas";
    fila.getCell(1).font = { bold: true, color: { argb: TINTA } };
    hoja.mergeCells(7, 2, 7, 7);
    fila.getCell(2).value = p.notas;
    fila.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }

  let filaActual = p.notas ? 9 : 8;
  const totalesPorTipo: Record<TipoCompra, TotalesPorMoneda> = {
    nacional: totalesVacios(),
    internacional: totalesVacios(),
  };

  for (const tipo of ["nacional", "internacional"] as TipoCompra[]) {
    const filas = p.partidas.flatMap((pa) =>
      pa.alternativas
        .filter((a) => a.elegida && a.tipoCompra === tipo)
        .flatMap((a) => a.items.map((it) => ({ partida: pa.nombre, proveedor: a.proveedor, it }))),
    );
    if (filas.length === 0) continue;

    const sec = hoja.getRow(filaActual);
    sec.getCell(1).value = TITULO_TIPO[tipo];
    sec.getCell(1).font = { size: 13, bold: true, color: { argb: TINTA } };
    filaActual += 1;

    const enc = hoja.getRow(filaActual);
    ["Partida", "Proveedor", "Descripción", "Cantidad", "Moneda", "Precio unitario", "Subtotal"].forEach((t, i) => {
      const c = enc.getCell(i + 1);
      c.value = t;
      c.font = { bold: true, color: { argb: TINTA } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FONDO_ENCABEZADO } };
      c.border = { bottom: { style: "thin", color: { argb: TINTA } } };
      c.alignment = { vertical: "middle", horizontal: i >= 3 ? "right" : "left" };
    });
    filaActual += 1;

    for (const { partida, proveedor, it } of filas) {
      const sub = subtotalItem(it.cantidad, it.precioUnitarioCentavos);
      totalesPorTipo[tipo][it.moneda] += sub;
      const r = hoja.getRow(filaActual);
      r.values = [
        partida,
        proveedor,
        it.descripcion,
        it.cantidad,
        it.moneda,
        it.precioUnitarioCentavos / 100,
        sub / 100,
      ];
      r.getCell(6).numFmt = FORMATO[it.moneda];
      r.getCell(7).numFmt = FORMATO[it.moneda];
      r.getCell(4).alignment = { horizontal: "right" };
      r.getCell(5).alignment = { horizontal: "right" };
      r.getCell(3).alignment = { wrapText: true, vertical: "top" };
      for (let c = 1; c <= 7; c++) r.getCell(c).border = { bottom: { style: "hair", color: { argb: LINEA } } };
      filaActual += 1;
    }

    for (const m of ["USD", "HNL"] as Moneda[]) {
      if (totalesPorTipo[tipo][m] === 0) continue;
      const r = hoja.getRow(filaActual);
      r.getCell(6).value = `Subtotal ${m}`;
      r.getCell(6).alignment = { horizontal: "right" };
      r.getCell(6).font = { bold: true };
      r.getCell(7).value = totalesPorTipo[tipo][m] / 100;
      r.getCell(7).numFmt = FORMATO[m];
      r.getCell(7).font = { bold: true };
      filaActual += 1;
    }
    filaActual += 1;
  }

  // Totales generales: uno por moneda, sin conversión
  const tituloTot = hoja.getRow(filaActual);
  tituloTot.getCell(1).value = "Total del presupuesto";
  tituloTot.getCell(1).font = { size: 13, bold: true, color: { argb: TINTA } };
  filaActual += 1;
  for (const m of ["USD", "HNL"] as Moneda[]) {
    const r = hoja.getRow(filaActual);
    r.getCell(1).value = m === "USD" ? "Total en dólares (USD)" : "Total en lempiras (HNL)";
    r.getCell(1).font = { bold: true };
    r.getCell(7).value = p.resumen.total[m] / 100;
    r.getCell(7).numFmt = FORMATO[m];
    r.getCell(7).font = { bold: true, size: 12 };
    r.getCell(7).border = { top: { style: "thin", color: { argb: TINTA } } };
    filaActual += 1;
  }
  const nota = hoja.getRow(filaActual + 1);
  nota.getCell(1).value = "Los montos en dólares y en lempiras se presentan por separado, sin conversión de moneda.";
  nota.getCell(1).font = { italic: true, size: 9, color: { argb: "FF5B6670" } };

  const buffer = await libro.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export function nombreArchivoExcel(p: { nombre: string; restaurante: string }): string {
  const base = `Presupuesto Sistemas - ${p.restaurante} - ${p.nombre}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.-]/g, "")
    .trim();
  return `${base}.xlsx`;
}
