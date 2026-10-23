import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerUsuario: vi.fn(),
  puedeCrearPresupuestos: vi.fn(),
  procesarCotizacion: vi.fn(),
}));

vi.mock("@/lib/sesion", () => ({ obtenerUsuario: mocks.obtenerUsuario }));
vi.mock("@/lib/datos", () => ({ puedeCrearPresupuestos: mocks.puedeCrearPresupuestos }));
vi.mock("@/lib/archivos", () => ({
  TAMANO_MAXIMO: 4 * 1024 * 1024,
  TIPOS_PERMITIDOS: { "application/pdf": "pdf" },
}));
vi.mock("@/lib/procesar-cotizacion", () => ({ procesarCotizacion: mocks.procesarCotizacion }));

import { POST } from "@/app/api/cotizaciones/extraer/route";

const creador = { id: "ana", name: "Ana", email: "ana@example.com", role: "creador" as const };

function requestWithFile(file: File): Request {
  const form = new FormData();
  form.set("archivo", file);
  return { formData: async () => form } as Request;
}

describe("POST /api/cotizaciones/extraer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.obtenerUsuario.mockResolvedValue(creador);
    mocks.puedeCrearPresupuestos.mockReturnValue(true);
    mocks.procesarCotizacion.mockResolvedValue({ archivoId: "archivo-1", archivoNombre: "cotizacion.pdf" });
  });

  it("rechaza archivos mayores a 4 MB antes de leer su contenido", async () => {
    const archivo = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "grande.pdf", { type: "application/pdf" });
    const leerContenido = vi.spyOn(archivo, "arrayBuffer");

    const response = await POST(requestWithFile(archivo));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "El archivo pasa de 4 MB. Comprime el PDF o toma una foto más liviana e intenta de nuevo." });
    expect(leerContenido).not.toHaveBeenCalled();
    expect(mocks.procesarCotizacion).not.toHaveBeenCalled();
  });

  it("requiere una sesión antes de leer el formulario", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    const formData = vi.fn();

    const response = await POST({ formData } as unknown as Request);

    expect(response.status).toBe(401);
    expect(formData).not.toHaveBeenCalled();
  });

  it("envía archivos válidos al procesador", async () => {
    const archivo = new File(["cotización"], "cotizacion.pdf", { type: "application/pdf" });

    const response = await POST(requestWithFile(archivo));

    expect(response.status).toBe(200);
    expect(mocks.procesarCotizacion).toHaveBeenCalledWith(
      creador,
      expect.objectContaining({ nombre: "cotizacion.pdf", mime: "application/pdf", tamano: archivo.size }),
    );
  });
});
