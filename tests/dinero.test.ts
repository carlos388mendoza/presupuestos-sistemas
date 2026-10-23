import { describe, expect, it } from "vitest";
import { aCentavos, formatear, resumenPresupuesto, totalesDeItems } from "@/lib/dinero";

describe("dinero", () => {
  it("convierte textos a centavos", () => {
    expect(aCentavos("1,234.50")).toBe(123450);
    expect(aCentavos("L 99.99")).toBe(9999);
    expect(aCentavos("0.1")).toBe(10);
    expect(aCentavos("abc")).toBeNull();
    expect(aCentavos("")).toBeNull();
  });

  it("redondea al centavo correcto aunque el decimal no sea exacto en coma flotante", () => {
    // 1.005 * 100 = 100.49999… en coma flotante; debe dar 101 centavos.
    expect(aCentavos("1.005")).toBe(101);
    expect(aCentavos(1.005)).toBe(101);
    expect(aCentavos("8.675")).toBe(868);
    expect(aCentavos("19.99")).toBe(1999);
    expect(aCentavos(0.1 + 0.2)).toBe(30);
    expect(aCentavos("1,234,567.89")).toBe(123456789);
  });

  it("suma por moneda sin convertir", () => {
    const t = totalesDeItems([
      { cantidad: 2, precioUnitarioCentavos: 10000, moneda: "USD" },
      { cantidad: 3, precioUnitarioCentavos: 50050, moneda: "HNL" },
      { cantidad: 1, precioUnitarioCentavos: 1, moneda: "USD" },
    ]);
    expect(t).toEqual({ USD: 20001, HNL: 150150 });
  });

  it("solo cuenta alternativas elegidas y separa nacional/internacional", () => {
    const r = resumenPresupuesto([
      {
        alternativas: [
          { elegida: true, tipoCompra: "internacional", items: [{ cantidad: 1, precioUnitarioCentavos: 500, moneda: "USD" }] },
          { elegida: false, tipoCompra: "nacional", items: [{ cantidad: 1, precioUnitarioCentavos: 99999, moneda: "HNL" }] },
        ],
      },
      {
        alternativas: [
          { elegida: true, tipoCompra: "nacional", items: [{ cantidad: 2, precioUnitarioCentavos: 1000, moneda: "HNL" }] },
        ],
      },
    ]);
    expect(r.total).toEqual({ USD: 500, HNL: 2000 });
    expect(r.internacional).toEqual({ USD: 500, HNL: 0 });
    expect(r.nacional).toEqual({ USD: 0, HNL: 2000 });
  });

  it("formatea con el símbolo de cada moneda", () => {
    expect(formatear(123450, "HNL")).toBe("L 1,234.50");
    expect(formatear(5, "USD")).toBe("$ 0.05");
  });
});
