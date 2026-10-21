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

describe("rol aprobador", () => {
  it("ve todos los presupuestos del departamento", async () => {
    const { db, damaris, p } = await armar();
    expect(await datos.listarPresupuestos(db, damaris)).toHaveLength(1);
    expect((await datos.obtenerPresupuesto(db, damaris, p.id)).id).toBe(p.id);
  });

  it("elige y quita alternativas en presupuestos ajenos", async () => {
    const { db, damaris, pa, a1, a2 } = await armar();
    await datos.elegirAlternativa(db, damaris, a1);
    await datos.elegirAlternativa(db, damaris, a2);
    let elegidas = (await db.select().from(alternativas).where(eq(alternativas.partidaId, pa.id))).filter((a) => a.elegida);
    expect(elegidas.map((a) => a.id)).toEqual([a2]);
    await datos.quitarEleccion(db, damaris, a2);
    elegidas = (await db.select().from(alternativas).where(eq(alternativas.partidaId, pa.id))).filter((a) => a.elegida);
    expect(elegidas).toHaveLength(0);
  });

  it("marca listo y reabre presupuestos ajenos", async () => {
    const { db, damaris, p, a1 } = await armar();
    await datos.elegirAlternativa(db, damaris, a1);
    await datos.marcarListo(db, damaris, p.id);
    expect((await datos.obtenerPresupuesto(db, damaris, p.id)).estado).toBe("listo");
    await datos.reabrir(db, damaris, p.id);
    expect((await datos.obtenerPresupuesto(db, damaris, p.id)).estado).toBe("borrador");
  });

  it("no crea, edita ni borra presupuestos, partidas ni alternativas", async () => {
    const { db, damaris, p, pa, a1 } = await armar();
    const rechaza = (promesa: Promise<unknown>) => expect(promesa).rejects.toThrow(/solo permite elegir/);
    await rechaza(datos.crearPresupuesto(db, damaris, { nombre: "X", restaurante: "Y", tipo: "apertura" }));
    await rechaza(
      datos.actualizarPresupuesto(db, damaris, p.id, { nombre: "X", restaurante: "Y", tipo: "apertura", notas: "" }),
    );
    await rechaza(datos.eliminarPresupuesto(db, damaris, p.id));
    await rechaza(datos.crearPartida(db, damaris, p.id, "Nueva"));
    await rechaza(datos.renombrarPartida(db, damaris, pa.id, "Otro nombre"));
    await rechaza(datos.eliminarPartida(db, damaris, pa.id));
    await rechaza(
      datos.guardarAlternativa(db, damaris, {
        partidaId: pa.id, proveedor: "X", tipoCompra: "nacional", notas: "", archivoId: null, items: [item(1, "HNL")],
      }),
    );
    await rechaza(
      datos.guardarAlternativa(db, damaris, {
        id: a1, partidaId: pa.id, proveedor: "X", tipoCompra: "nacional", notas: "", archivoId: null, items: [item(1, "HNL")],
      }),
    );
    await rechaza(datos.eliminarAlternativa(db, damaris, a1));
    // Nada cambió
    const completo = await datos.obtenerPresupuesto(db, damaris, p.id);
    expect(completo.nombre).toBe("Apertura");
    expect(completo.partidas.map((x) => x.nombre)).toEqual(["Red"]);
    expect(completo.partidas[0].alternativas).toHaveLength(2);
  });

  it("no maneja usuarios; los otros roles quedan igual", async () => {
    const { damaris, admin, ana } = await armar();
    expect(datos.puedeManejarUsuarios(damaris)).toBe(false);
    expect(datos.puedeManejarUsuarios(admin)).toBe(true);
    expect(datos.puedeManejarUsuarios(ana)).toBe(false);
    expect(datos.puedeCrearPresupuestos(ana)).toBe(true);
    expect(datos.permisosPresupuesto(ana, "ana")).toEqual({ modificar: true, decidir: true });
    expect(datos.permisosPresupuesto(admin, "ana")).toEqual({ modificar: true, decidir: true });
    expect(datos.permisosPresupuesto(damaris, "ana")).toEqual({ modificar: false, decidir: true });
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
