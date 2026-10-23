import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handleUpload: vi.fn(),
  obtenerUsuario: vi.fn(),
  puedeCrearPresupuestos: vi.fn(),
}));

vi.mock("@vercel/blob/client", () => ({ handleUpload: mocks.handleUpload }));
vi.mock("@/lib/sesion", () => ({ obtenerUsuario: mocks.obtenerUsuario }));
vi.mock("@/lib/datos", () => ({ puedeCrearPresupuestos: mocks.puedeCrearPresupuestos }));
vi.mock("@/lib/archivos", () => ({
  TIPOS_PERMITIDOS: {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  },
}));

import { POST } from "@/app/api/archivos/subida/route";

const creador = { id: "ana", name: "Ana", email: "ana@example.com", role: "creador" as const };
const pathname = `cotizaciones/ana/123e4567-e89b-42d3-a456-426614174000.pdf`;

describe("POST /api/archivos/subida", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ARCHIVOS_STORAGE = "blob";
    mocks.obtenerUsuario.mockResolvedValue(creador);
    mocks.puedeCrearPresupuestos.mockReturnValue(true);
    mocks.handleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => ({
      config: await onBeforeGenerateToken(pathname, null, false),
    }));
  });

  it("emite token limitado al usuario, formatos y tamaño permitido", async () => {
    const response = await POST(new Request("http://localhost/api/archivos/subida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.config).toMatchObject({
      maximumSizeInBytes: 4 * 1024 * 1024,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    expect(body.config.allowedContentTypes).toContain("application/pdf");
    expect(body.config.allowedContentTypes).toContain("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });

  it("rechaza rutas que no pertenecen al usuario autenticado", async () => {
    mocks.handleUpload.mockImplementation(async ({ onBeforeGenerateToken }) =>
      onBeforeGenerateToken("cotizaciones/beto/123e4567-e89b-42d3-a456-426614174000.pdf", null, false),
    );

    const response = await POST(new Request("http://localhost/api/archivos/subida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "La ruta del archivo no es válida." });
  });
});
