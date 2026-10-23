import { afterEach, describe, expect, it } from "vitest";
import { archivos } from "@/db/schema";
import * as datos from "@/lib/datos";
import { generarExcel } from "@/lib/excel";
import { cerrarTodo, dbDePrueba, item } from "./ayuda";

afterEach(cerrarTodo);

describe("flujo de cotización y aprobación", () => {
  it("permite revisar la cotización, aprobar la alternativa y exportar el presupuesto", async () => {
    const { db, ana, beto, damaris } = await dbDePrueba();
    const presupuesto = await datos.crearPresupuesto(db, ana, {
      nombre: "Apertura Centro",
      restaurante: "Centro",
      tipo: "apertura",
    });
    const partida = await datos.crearPartida(db, ana, presupuesto.id, "Red y comunicaciones");
    const [archivo] = await db.insert(archivos).values({
      nombreOriginal: "cotizacion-red.pdf",
      nombreGuardado: "cotizacion-red-test.pdf",
      almacenamiento: "local",
      mime: "application/pdf",
      tamano: 1200,
      subidoPor: ana.id,
    }).returning();

    expect(await datos.puedeVerArchivo(db, damaris, archivo.id)).toBe(false);
    const alternativaId = await datos.guardarAlternativa(db, ana, {
      partidaId: partida.id,
      proveedor: "Proveedor de prueba",
      tipoCompra: "nacional",
      notas: "Cotización verificada",
      archivoId: archivo.id,
      items: [{ ...item(125000, "HNL"), descripcion: "Switch administrable" }],
    });

    expect(await datos.puedeVerArchivo(db, ana, archivo.id)).toBe(true);
    expect(await datos.puedeVerArchivo(db, damaris, archivo.id)).toBe(true);
    expect(await datos.puedeVerArchivo(db, beto, archivo.id)).toBe(false);

    await datos.elegirAlternativa(db, damaris, alternativaId);
    await datos.marcarListo(db, damaris, presupuesto.id);
    const completo = await datos.obtenerPresupuesto(db, damaris, presupuesto.id);
    const excel = await generarExcel(completo);

    expect(completo.estado).toBe("listo");
    expect(completo.resumen.total.HNL).toBe(125000);
    expect(excel.subarray(0, 4).toString("hex")).toBe("504b0304");
  });
});
