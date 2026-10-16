import type { Moneda } from "@/db/schema";
import { formatear, type TotalesPorMoneda } from "@/lib/dinero";

const NOMBRE: Record<Moneda, string> = { USD: "Dólares", HNL: "Lempiras" };

/** Par de totales lado a lado. Dólares y lempiras nunca se suman entre sí. */
export function Totales({ totales, tamano = "normal" }: { totales: TotalesPorMoneda; tamano?: "grande" | "normal" | "compacto" }) {
  if (tamano === "compacto") {
    return (
      <span className="cifra inline-flex gap-3 text-sm">
        <span className="text-usd">{formatear(totales.USD, "USD")}</span>
        <span className="text-hnl">{formatear(totales.HNL, "HNL")}</span>
      </span>
    );
  }
  const grande = tamano === "grande";
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {(["USD", "HNL"] as Moneda[]).map((m) => (
        <div
          key={m}
          className={`border-l-4 bg-papel pl-4 ${grande ? "py-3" : "py-1.5"} ${m === "USD" ? "border-usd" : "border-hnl"}`}
        >
          <div className="text-sm text-suave">
            {NOMBRE[m]} <span className="text-xs">({m})</span>
          </div>
          <div className={`cifra font-semibold ${grande ? "text-3xl tracking-tight" : "text-lg"} ${m === "USD" ? "text-usd" : "text-hnl"}`}>
            {formatear(totales[m], m)}
          </div>
        </div>
      ))}
    </div>
  );
}
