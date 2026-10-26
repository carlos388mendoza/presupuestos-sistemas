import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: createMock } };
  },
}));

import { extraerCotizacion } from "@/lib/extraccion";

async function crearPdf(textoPorPagina: string[], paginasConTexto = textoPorPagina.length): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument();
  const partes: Buffer[] = [];
  doc.on("data", (parte: Buffer) => partes.push(parte));
  const terminado = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(partes))));
  for (let i = 0; i < textoPorPagina.length; i++) {
    if (i > 0) doc.addPage();
    if (i < paginasConTexto) doc.text(textoPorPagina[i]);
  }
  doc.end();
  return terminado;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OPENROUTER_API_KEY = "prueba";
  process.env.OPENROUTER_MODEL = "nvidia/nemotron-3.5-super-vl:free";
});

afterEach(() => {
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_MODEL;
});

describe("extracción de cotizaciones", () => {
  it("lee un PDF con texto y envía solo el texto a la IA", async () => {
    const pdf = await crearPdf(["Proveedor Acme. Switch 24 puertos, cantidad 2, precio 125.50 USD."]);
    async function* stream() {
      yield { choices: [{ delta: { content: JSON.stringify({ proveedor: "Acme", tipoCompra: "nacional", items: [{ descripcion: "Switch 24 puertos", marca: "", modelo: "", cantidad: 2, precioUnitario: 125.5, moneda: "USD" }] }) } }] };
    }
    createMock.mockResolvedValue(stream());

    const resultado = await extraerCotizacion(pdf, "application/pdf", "cotizacion.pdf");

    expect(resultado.proveedor).toBe("Acme");
    expect(resultado.items).toHaveLength(1);
    expect(resultado.items[0]).toMatchObject({ descripcion: "Switch 24 puertos", cantidad: 2, precioUnitario: 125.5, moneda: "USD" });
    const llamada = createMock.mock.calls[0][0];
    expect(llamada.messages[1].content[1]).toMatchObject({ type: "text" });
    expect(llamada.messages[1].content[1].text).toContain("Switch 24 puertos");
  });

  it("no llama a la IA cuando el PDF es una imagen escaneada", async () => {
    const pdf = await crearPdf([""], 0);

    await expect(extraerCotizacion(pdf, "application/pdf", "escaneado.pdf")).rejects.toThrow(
      "Este PDF es una imagen escaneada. Sube una foto o captura de la cotización para leerla automáticamente, o ingresa los ítems a mano.",
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("lee solo las primeras 5 páginas de un PDF largo", async () => {
    const textos = Array.from({ length: 7 }, (_, i) => `Página ${i + 1} con datos suficientes para la IA.`);
    const pdf = await crearPdf(textos);
    async function* stream() {
      yield { choices: [{ delta: { content: JSON.stringify({ proveedor: "Acme", tipoCompra: "nacional", items: [] }) } }] };
    }
    createMock.mockResolvedValue(stream());

    await extraerCotizacion(pdf, "application/pdf", "largo.pdf");

    const textoEnviado = createMock.mock.calls[0][0].messages[1].content[1].text as string;
    expect(textoEnviado).toContain("Página 5");
    expect(textoEnviado).not.toContain("Página 6");
  });
});