import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { alternativas, equipos } from "@/db/schema";
import * as datos from "@/lib/datos";
import { buscarCoincidencia } from "@/lib/coincidencias";
import { cerrarTodo, dbDePrueba, item } from "./ayuda";

afterEach(cerrarTodo);

async function armar() {
  const ctx = await dbDePrueba();
  const p = await datos.crearPresupuesto(ctx.db, ctx.ana, { nombre: "Apertura", restaurante: "Centro", tipo: "apertura" });
  const pa = await datos.crearPartida(ctx.db, ctx.ana, p.id, "Red");
  const a1 = await datos.guardarAlternativa(ctx.db, ctx.ana, {
    partidaId: pa.id, proveedor: "A", tipoCompra: "nacional", notas: "", archivoId: null, items: [item(1000, "HNL")],
  });
  const a2 = await datos.guardarAlternativa(ctx.db, ctx.ana, {
    partidaId: pa.id, proveedor: "B", tipoCompra: "internacional", notas: "", archivoId: null, items: [item(300, "USD", 2)],
  });
  return { ...ctx, p, pa, a1, a2 };
}

describe("permisos", () => {
  it("un creador no ve presupuestos ajenos", async () => {
    const { db, beto, ana, admin, p } = await armar();
    await expect(datos.obtenerPresupuesto(db, beto, p.id)).rejects.toThrow(datos.ErrorNegocio);
    expect(await datos.listarPresupuestos(db, beto)).toHaveLength(0);
    expect(await datos.listarPresupuestos(db, ana)).toHaveLength(1);
    expect(await datos.listarPresupuestos(db, admin)).toHaveLength(1);
  });

  it("un creador no puede modificar alternativas ajenas", async () => {
    const { db, beto, a1, pa } = await armar();
    await expect(datos.elegirAlternativa(db, beto, a1)).rejects.toThrow(datos.ErrorNegocio);
    await expect(datos.eliminarAlternativa(db, beto, a1)).rejects.toThrow(datos.ErrorNegocio);
    await expect(
      datos.guardarAlternativa(db, beto, {
        partidaId: pa.id, proveedor: "X", tipoCompra: "nacional", notas: "", archivoId: null, items: [item(1, "HNL")],
      }),
    ).rejects.toThrow(datos.ErrorNegocio);
  });
});

describe("elección de alternativas", () => {
  it("solo hay una elegida por partida", async () => {
    const { db, ana, pa, a1, a2 } = await armar();
    await datos.elegirAlternativa(db, ana, a1);
    await datos.elegirAlternativa(db, ana, a2);
    const elegidas = (await db.select().from(alternativas).where(eq(alternativas.partidaId, pa.id))).filter((a) => a.elegida);
    expect(elegidas.map((a) => a.id)).toEqual([a2]);
  });

  it("la base de datos rechaza dos elegidas en la misma partida", async () => {
    const { db, a1, a2 } = await armar();
    await db.update(alternativas).set({ elegida: true }).where(eq(alternativas.id, a1));
    await expect(db.update(alternativas).set({ elegida: true }).where(eq(alternativas.id, a2))).rejects.toThrow();
  });

  it("el total usa solo la elegida", async () => {
    const { db, ana, p, a2 } = await armar();
    await datos.elegirAlternativa(db, ana, a2);
    const r = (await datos.obtenerPresupuesto(db, ana, p.id)).resumen;
    expect(r.total).toEqual({ USD: 600, HNL: 0 });
    expect(r.internacional.USD).toBe(600);
  });
});

describe("estado del presupuesto", () => {
  it("no se marca listo si falta elegir", async () => {
    const { db, ana, p, a1 } = await armar();
    await expect(datos.marcarListo(db, ana, p.id)).rejects.toThrow(/Elige una alternativa/);
    await datos.elegirAlternativa(db, ana, a1);
    await datos.marcarListo(db, ana, p.id);
    expect((await datos.obtenerPresupuesto(db, ana, p.id)).estado).toBe("listo");
  });

  it("un presupuesto listo no se puede editar hasta reabrirlo", async () => {
    const { db, ana, p, a1, a2 } = await armar();
    await datos.elegirAlternativa(db, ana, a1);
    await datos.marcarListo(db, ana, p.id);
    await expect(datos.elegirAlternativa(db, ana, a2)).rejects.toThrow(/Reábrelo/);
    await datos.reabrir(db, ana, p.id);
    await datos.elegirAlternativa(db, ana, a2);
  });
});

describe("catálogo automático", () => {
  it("crea equipos marcados por revisar cuando la IA trae uno nuevo", async () => {
    const { db, ana, pa } = await armar();
    await datos.guardarAlternativa(db, ana, {
      partidaId: pa.id, proveedor: "C", tipoCompra: "nacional", notas: "", archivoId: null,
      items: [{ ...item(100, "HNL"), crearEquipo: true, origenEquipo: "ia", descripcion: "Switch 8p", marca: "TP-Link", modelo: "TL-SG108" }],
    });
    const e = await db.select().from(equipos);
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({ nombre: "Switch 8p", origen: "ia", revisado: false });
  });

  it("encuentra coincidencias por marca y modelo aunque cambie el formato", async () => {
    const cat = [
      { id: "1", nombre: "Access point", marca: "Ubiquiti", modelo: "U6-Lite" },
      { id: "2", nombre: "Impresora térmica de recibos", marca: "Epson", modelo: "TM-T20III" },
    ];
    expect(buscarCoincidencia({ descripcion: "AP", marca: "UBIQUITI", modelo: "u6 lite" }, cat)?.id).toBe("1");
    expect(buscarCoincidencia({ descripcion: "Impresora termica de recibos", marca: "", modelo: "" }, cat)?.id).toBe("2");
    expect(buscarCoincidencia({ descripcion: "Monitor 24 pulgadas", marca: "LG", modelo: "24MK430" }, cat)).toBeNull();
  });
});
