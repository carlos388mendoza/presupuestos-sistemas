import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import { extraerTextoPdf, pdfTieneTextoSuficiente, MAXIMO_PAGINAS_PDF } from "@/lib/pdf-texto";

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
- Si el contenido viene en filas de Excel o texto de Word, usa los encabezados y filas para identificar cada producto y su precio.
- No conviertas monedas. Usa la moneda en que está expresado cada precio: "L", "Lps" o "HNL" es HNL; "$", "US$" o "USD" es USD.
- precioUnitario es el precio por unidad antes de impuestos. Si solo aparece el total de la línea, divídelo entre la cantidad.
- No incluyas como ítems los subtotales, impuestos (ISV), descuentos globales ni el total general.
- Si una línea es un servicio (instalación, configuración, envío), inclúyela igual con marca y modelo vacíos.
- Responde solo con el JSON solicitado.`;

export class ErrorExtraccion extends Error {}

export function extraccionDisponible(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL);
}

const MAXIMO_TEXTO_OFICINA = 30_000;

async function extraerTextoOficina(archivo: Buffer, mime: string): Promise<string | null> {
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = (await import("mammoth")).default;
    const { value } = await mammoth.extractRawText({ buffer: archivo as never });
    return value.slice(0, MAXIMO_TEXTO_OFICINA).trim();
  }
  if (mime !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return null;

  const ExcelJS = (await import("exceljs")).default;
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(archivo as never);
  const lineas: string[] = [];
  let caracteres = 0;
  for (const hoja of libro.worksheets.slice(0, 20)) {
    if (caracteres >= MAXIMO_TEXTO_OFICINA) break;
    lineas.push(`Hoja: ${hoja.name}`);
    caracteres += hoja.name.length + 7;
    hoja.eachRow({ includeEmpty: false }, (fila, numero) => {
      if (caracteres >= MAXIMO_TEXTO_OFICINA) return;
      const valores = fila.values as unknown[];
      const celdas = valores.slice(1).map((valor, indice) => {
        const texto = fila.getCell(indice + 1).text?.trim();
        if (texto) return texto;
        if (valor && typeof valor === "object" && "result" in valor) return String(valor.result ?? "");
        return valor == null ? "" : String(valor);
      });
      const contenido = celdas.join(" | ").trim();
      if (contenido.replace(/[|\s]/g, "")) {
        const linea = `Fila ${numero}: ${contenido}`;
        lineas.push(linea);
        caracteres += linea.length + 1;
      }
    });
  }
  return lineas.join("\n").slice(0, MAXIMO_TEXTO_OFICINA).trim();
}

let clienteCache: OpenAI | undefined;

function clienteIA() {
  if (!clienteCache) {
    clienteCache = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      // El endpoint de Vercel permite hasta 300 s; deja margen al proveedor para
      // cotizaciones extensas sin abandonar el análisis a los 30 s.
      timeout: 120_000,
      maxRetries: 0,
      defaultHeaders: { "X-Title": "Presupuestos Sistemas" },
    });
  }
  return clienteCache;
}

export async function extraerCotizacion(
  archivo: Buffer,
  mime: string,
  nombre: string,
  categorias?: { id: string; nombre: string }[],
): Promise<CotizacionExtraida & { items: (CotizacionExtraida["items"][number] & { partidaId?: string })[] }> {
  if (!extraccionDisponible()) {
    throw new ErrorExtraccion("La lectura automática no está configurada (faltan OPENROUTER_API_KEY u OPENROUTER_MODEL).");
  }

  let contenidoArchivo: { type: string; [key: string]: unknown };
  try {
    const textoOficina = await extraerTextoOficina(archivo, mime);
    if (textoOficina !== null) {
      if (!textoOficina) throw new ErrorExtraccion("El archivo no contiene texto legible. Revisa que tenga datos y no esté protegido con contraseña.");
      contenidoArchivo = { type: "text", text: `Contenido extraído de ${nombre}:\n${textoOficina}` };
    } else if (mime === "application/pdf") {
      let textoPdf = "";
      try {
        textoPdf = await extraerTextoPdf(archivo);
      } catch {
        throw new ErrorExtraccion("No se pudo leer el PDF. Si está protegido o dañado, guárdalo de nuevo e intenta otra vez.");
      }
      if (!pdfTieneTextoSuficiente(textoPdf)) {
        throw new ErrorExtraccion("Este PDF es una imagen escaneada. Sube una foto o captura de la cotización para leerla automáticamente, o ingresa los ítems a mano.");
      }
      contenidoArchivo = { type: "text", text: `Contenido extraído de ${nombre} (primeras ${MAXIMO_PAGINAS_PDF} páginas):\n${textoPdf}` };
    } else {
      const dataUrl = `data:${mime};base64,${archivo.toString("base64")}`;
      contenidoArchivo = { type: "image_url", image_url: { url: dataUrl } };
    }
  } catch (e) {
    if (e instanceof ErrorExtraccion) throw e;
    throw new ErrorExtraccion("No se pudo leer el archivo de Excel o Word. Si está protegido o dañado, guárdalo de nuevo e intenta otra vez.");
  }

  let texto: string | null | undefined;
  try {
    const esquemaConPartidas = categorias?.length
      ? {
          ...esquemaJson,
          properties: {
            ...esquemaJson.properties,
            items: {
              ...esquemaJson.properties.items,
              items: {
                ...esquemaJson.properties.items.items,
                properties: {
                  ...esquemaJson.properties.items.items.properties,
                  partidaId: {
                    type: "string",
                    enum: categorias.map((categoria) => categoria.id),
                    description: `Partida existente. Opciones: ${categorias.map((categoria) => `${categoria.id}=${categoria.nombre}`).join("; ")}`,
                  },
                },
                required: [...esquemaJson.properties.items.items.required, "partidaId"],
              },
            },
          },
        }
      : esquemaJson;
    const instrucciones = categorias?.length
      ? `${INSTRUCCIONES}\n- Clasifica cada producto en la partida existente que mejor corresponda. Devuelve solo su partidaId de las opciones permitidas; nunca inventes partidas.\nPartidas: ${categorias.map((categoria) => `${categoria.id}: ${categoria.nombre}`).join("; ")}`
      : INSTRUCCIONES;
    const stream = await clienteIA().chat.completions.create({
      model: process.env.OPENROUTER_MODEL!,
      temperature: 0,
      reasoning: { effort: "none" },
      max_completion_tokens: 3000,
      stream: true,
      messages: [
        { role: "system", content: instrucciones },
        {
          role: "user",
          // El SDK de OpenAI no tipa el bloque "file" de OpenRouter
          content: [{ type: "text", text: "Extrae los datos de esta cotización." }, contenidoArchivo] as never,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "cotizacion", strict: true, schema: esquemaConPartidas as unknown as Record<string, unknown> },
      },
    });
    const fragmentos: string[] = [];
    const razonamientos: string[] = [];
    for await (const parte of stream) {
      const fragmento = parte.choices[0]?.delta?.content;
      if (typeof fragmento === "string") fragmentos.push(fragmento);
      const razonamiento = parte.choices[0]?.delta?.reasoning;
      if (typeof razonamiento === "string") razonamientos.push(razonamiento);
    }
    texto = fragmentos.join("");
    if (!texto && razonamientos.length) texto = razonamientos.join("");
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
  const esquemaConPartidas = categorias?.length
    ? esquemaRespuesta.extend({ items: z.array(esquemaRespuesta.shape.items.element.extend({ partidaId: z.enum(categorias.map((categoria) => categoria.id) as [string, ...string[]]) })) })
    : esquemaRespuesta;
  const r = esquemaConPartidas.safeParse(json);
  if (!r.success) throw new ErrorExtraccion("La respuesta de la IA no tiene el formato esperado.");
  return r.data;
}
