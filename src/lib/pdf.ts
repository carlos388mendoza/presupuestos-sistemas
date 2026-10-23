import PDFDocument from "pdfkit";
import type { Moneda, TipoCompra } from "@/db/schema";
import type { PresupuestoCompleto } from "./datos";
import { formatear, subtotalItem } from "./dinero";

const LABEL: Record<TipoCompra, string> = {
  nacional: "Compras nacionales",
  internacional: "Compras internacionales",
};

/** Genera un resumen imprimible del presupuesto con las alternativas elegidas. */
export async function generarPdf(p: PresupuestoCompleto): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 42, bufferPages: true });
  const partes: Buffer[] = [];
  doc.on("data", (parte: Buffer) => partes.push(parte));
  const terminado = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);
  });
  const ancho = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnas = [0.15, 0.15, 0.35, 0.08, 0.12, 0.15].map((porcion) => ancho * porcion);
  const x = () => doc.page.margins.left;

  doc.font("Helvetica-Bold").fontSize(18).fillColor("#1d2b3a").text(`Presupuesto de Sistemas · ${p.nombre}`);
  doc.moveDown(0.4).font("Helvetica").fontSize(10).fillColor("#303a43");
  doc.text(`Restaurante: ${p.restaurante}    Tipo: ${p.tipo === "apertura" ? "Apertura" : "Remodelación"}`);
  doc.text(`Elaborado por: ${p.autor}    Fecha: ${new Date().toLocaleDateString("es-HN")}`);
  if (p.notas) doc.moveDown(0.3).text(`Notas: ${p.notas}`, { width: ancho });
  doc.moveDown(0.8);

  function encabezadoTabla() {
    const labels = ["Partida", "Proveedor", "Descripción", "Cantidad", "Precio unitario", "Subtotal"];
    let left = x();
    const y = doc.y;
    doc.rect(x(), y, ancho, 22).fill("#e8edeb");
    doc.fillColor("#1d2b3a").font("Helvetica-Bold").fontSize(8);
    labels.forEach((label, i) => {
      doc.text(label, left + 4, y + 7, { width: columnas[i] - 8, lineBreak: false });
      left += columnas[i];
    });
    doc.y = y + 27;
  }

  for (const tipo of ["nacional", "internacional"] as TipoCompra[]) {
    const filas = p.partidas.flatMap((partida) => partida.alternativas
      .filter((alternativa) => alternativa.elegida && alternativa.tipoCompra === tipo)
      .flatMap((alternativa) => alternativa.items.map((item) => ({ partida, alternativa, item }))));
    if (!filas.length) continue;
    if (doc.y > doc.page.height - 90) doc.addPage();
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#1d2b3a").text(LABEL[tipo]);
    doc.moveDown(0.4);
    encabezadoTabla();
    for (const { partida, alternativa, item } of filas) {
      const renglones = [partida.nombre, alternativa.proveedor, item.descripcion, String(item.cantidad), formatear(item.precioUnitarioCentavos, item.moneda), formatear(subtotalItem(item.cantidad, item.precioUnitarioCentavos), item.moneda)];
      doc.font("Helvetica").fontSize(8);
      const alto = Math.max(20, ...renglones.map((t, i) => doc.heightOfString(t, { width: columnas[i] - 8 }))) + 8;
      if (doc.y + alto > doc.page.height - 44) { doc.addPage(); encabezadoTabla(); }
      let left = x();
      const y = doc.y;
      doc.font("Helvetica").fontSize(8).fillColor("#303a43");
      renglones.forEach((texto, i) => {
        doc.text(texto, left + 4, y + 4, { width: columnas[i] - 8, height: alto - 6, ellipsis: true });
        left += columnas[i];
      });
      doc.moveTo(x(), y + alto).lineTo(x() + ancho, y + alto).strokeColor("#d3dad7").lineWidth(0.4).stroke();
      doc.y = y + alto;
    }
    doc.moveDown(0.8);
  }

  if (doc.y > doc.page.height - 100) doc.addPage();
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#1d2b3a").text("Total del presupuesto");
  for (const moneda of ["USD", "HNL"] as Moneda[]) {
    doc.font("Helvetica-Bold").fontSize(10).text(`Total en ${moneda}: ${formatear(p.resumen.total[moneda], moneda)}`);
  }
  doc.moveDown(0.4).font("Helvetica-Oblique").fontSize(8).fillColor("#5b6670")
    .text("Los montos en dólares y en lempiras se presentan por separado, sin conversión de moneda.");
  doc.end();
  return terminado;
}

export function nombreArchivoPdf(p: { nombre: string; restaurante: string }): string {
  const base = `Presupuesto Sistemas - ${p.restaurante} - ${p.nombre}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.-]/g, "")
    .trim();
  return `${base}.pdf`;
}
