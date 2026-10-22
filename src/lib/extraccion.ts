import "server-only";
import OpenAI from "openai";
import { z } from "zod";

const esquemaRespuesta = z.object({
  proveedor: z.string(),
  tipoCompra: z.enum(["nacional", "internacional"]),
  items: z.array(
    z.object({
      descripcion: z.string(),
      marca: z.string(),
      modelo: z.string(),
      cantidad: z.number().positive(),
      precioUnitario: z.number().nonnegative(),
      moneda: z.enum(["USD", "HNL"]),
    }),
  ),
});

export type CotizacionExtraida = z.infer<typeof esquemaRespuesta>;

const esquemaJson = {
  type: "object",
  properties: {
    proveedor: { type: "string", description: "Nombre comercial del proveedor que emite la cotización" },
    tipoCompra: {
      type: "string",
      enum: ["nacional", "internacional"],
      description: "nacional si el proveedor está en Honduras, internacional si está fuera",
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          descripcion: { type: "string", description: "Nombre corto y claro del equipo o servicio" },
          marca: { type: "string", description: "Marca, o cadena vacía si no aparece" },
          modelo: { type: "string", description: "Modelo o número de parte, o cadena vacía" },
          cantidad: { type: "number" },
          precioUnitario: { type: "number", description: "Precio unitario sin símbolo de moneda" },
          moneda: { type: "string", enum: ["USD", "HNL"] },
        },
        required: ["descripcion", "marca", "modelo", "cantidad", "precioUnitario", "moneda"],
        additionalProperties: false,
      },
    },
  },
  required: ["proveedor", "tipoCompra", "items"],
  additionalProperties: false,
} as const;

const INSTRUCCIONES = `Eres un asistente que lee cotizaciones de proveedores de equipo de tecnología para restaurantes en Honduras.
Extrae el proveedor y cada línea cotizada.
Reglas:
- No conviertas monedas. Usa la moneda en que está expresado cada precio: "L", "Lps" o "HNL" es HNL; "$", "US$" o "USD" es USD.
- precioUnitario es el precio por unidad antes de impuestos. Si solo aparece el total de la línea, divídelo entre la cantidad.
- No incluyas como ítems los subtotales, impuestos (ISV), descuentos globales ni el total general.
- Si una línea es un servicio (instalación, configuración, envío), inclúyela igual con marca y modelo vacíos.
- Responde solo con el JSON solicitado.`;

export class ErrorExtraccion extends Error {}

export function extraccionDisponible(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL);
}

export async function extraerCotizacion(archivo: Buffer, mime: string, nombre: string): Promise<CotizacionExtraida> {
  if (!extraccionDisponible()) {
    throw new ErrorExtraccion("La lectura automática no está configurada (faltan OPENROUTER_API_KEY u OPENROUTER_MODEL).");
  }

  const cliente = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    // La extracción de una cotización no necesita razonamiento extenso ni reintentos
    // que mantengan al usuario esperando si el proveedor gratuito está saturado.
    timeout: 45_000,
    maxRetries: 0,
    defaultHeaders: { "X-Title": "Presupuestos Sistemas" },
  });

  const dataUrl = `data:${mime};base64,${archivo.toString("base64")}`;
  const contenidoArchivo =
    mime === "application/pdf"
      ? { type: "file", file: { filename: nombre, file_data: dataUrl } }
      : { type: "image_url", image_url: { url: dataUrl } };

  let texto: string | null | undefined;
  try {
    const res = await cliente.chat.completions.create({
      model: process.env.OPENROUTER_MODEL!,
      temperature: 0,
      reasoning_effort: "none",
      max_completion_tokens: 3000,
      messages: [
        { role: "system", content: INSTRUCCIONES },
        {
          role: "user",
          // El SDK de OpenAI no tipa el bloque "file" de OpenRouter
          content: [{ type: "text", text: "Extrae los datos de esta cotización." }, contenidoArchivo] as never,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "cotizacion", strict: true, schema: esquemaJson as unknown as Record<string, unknown> },
      },
    });
    texto = res.choices[0]?.message?.content;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new ErrorExtraccion(`No se pudo contactar al servicio de IA: ${msg}`);
  }

  if (!texto) throw new ErrorExtraccion("La IA no devolvió contenido.");
  let json: unknown;
  try {
    json = JSON.parse(texto.replace(/```json|```/g, "").trim());
  } catch {
    throw new ErrorExtraccion("La IA devolvió una respuesta que no es JSON válido.");
  }
  const r = esquemaRespuesta.safeParse(json);
  if (!r.success) throw new ErrorExtraccion("La respuesta de la IA no tiene el formato esperado.");
  return r.data;
}
