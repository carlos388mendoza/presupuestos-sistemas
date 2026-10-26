import { extractText } from "unpdf";

/** Número máximo de páginas que se leen de un PDF de cotización. */
export const MAXIMO_PAGINAS_PDF = 5;

/** Mínimo de texto para considerar que el PDF no es solo una imagen escaneada. */
export const MINIMO_TEXTO_PDF = 40;

/**
 * Extrae el texto de las primeras páginas de un PDF, en el servidor y sin
 * dependencias nativas (compatible con Vercel).
 */
export async function extraerTextoPdf(archivo: Buffer): Promise<string> {
  const { text } = await extractText(new Uint8Array(archivo), { mergePages: false });
  const paginas = Array.isArray(text) ? text : [String(text ?? "")];
  return paginas
    .slice(0, MAXIMO_PAGINAS_PDF)
    .map((pagina) => pagina.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

/** Indica si el texto extraído es suficiente para enviarlo a la IA. */
export function pdfTieneTextoSuficiente(texto: string): boolean {
  return texto.trim().length >= MINIMO_TEXTO_PDF;
}