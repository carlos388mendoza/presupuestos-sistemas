import Link from "next/link";
import { Etiqueta } from "@/components/Etiqueta";
import { Totales } from "@/components/Totales";
import { ejemploCafeteriaLaCeiba } from "@/lib/ejemplo-cafeteria";
import { formatear, resumenPresupuesto, subtotalItem, totalesDeItems } from "@/lib/dinero";

const resumen = resumenPresupuesto(ejemploCafeteriaLaCeiba.partidas);

export default function PaginaEjemploCafeteria() {
  return (
    <>
      <Link href="/presupuestos" className="btn-texto -ml-1.5 mb-2">Volver a presupuestos</Link>

      <header className="mb-6">
        <p className="text-sm text-suave">{ejemploCafeteriaLaCeiba.restaurante} · Remodelación · Datos ficticios</p>
        <h1 className="titulo-pagina flex flex-wrap items-center gap-3">
          {ejemploCafeteriaLaCeiba.nombre}
          <Etiqueta tipo="borrador">Ejemplo</Etiqueta>
        </h1>
        <p className="ayuda mt-1 max-w-prose">{ejemploCafeteriaLaCeiba.notas}</p>
      </header>

      <section aria-labelledby="titulo-totales" className="panel mb-8 p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titulo-totales" className="font-semibold">Total de las alternativas seleccionadas</h2>
          <p className="text-xs text-suave">Sin conversión entre monedas · Solo demostración</p>
        </div>
        <Totales totales={resumen.total} tamano="grande" />
        <dl className="mt-4 grid gap-x-8 gap-y-1 border-t border-linea-2 pt-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4">
            <dt className="text-suave">Compras nacionales</dt>
            <dd><Totales totales={resumen.nacional} tamano="compacto" /></dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-suave">Compras internacionales</dt>
            <dd><Totales totales={resumen.internacional} tamano="compacto" /></dd>
          </div>
        </dl>
      </section>

      <div className="space-y-8">
        {ejemploCafeteriaLaCeiba.partidas.map((partida) => (
          <section key={partida.id} className="space-y-4">
            <h2 className="text-lg font-semibold">{partida.nombre}</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {partida.alternativas.map((alternativa) => {
                const totales = totalesDeItems(alternativa.items);
                return (
                  <article key={alternativa.id} className="panel overflow-hidden">
                    <header className="flex flex-wrap items-start justify-between gap-2 border-b border-linea-2 p-4">
                      <div>
                        <h3 className="font-semibold">{alternativa.proveedor}</h3>
                        <p className="text-sm text-suave">Compra {alternativa.tipoCompra} · Cotización ficticia</p>
                      </div>
                      <Etiqueta tipo={alternativa.elegida ? "listo" : "borrador"}>
                        {alternativa.elegida ? "Seleccionada" : "Alternativa"}
                      </Etiqueta>
                    </header>
                    <div className="space-y-3 p-4 sm:hidden">
                      {alternativa.items.map((item) => (
                        <div key={item.descripcion} className="min-w-0 rounded-md border border-linea-2 p-3">
                          <p className="break-words text-sm font-medium">{item.descripcion}</p>
                          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <span className="text-suave">Cantidad</span><span className="cifra text-right">{item.cantidad}</span>
                            <span className="text-suave">Precio unitario</span><span className="cifra text-right">{formatear(item.precioUnitarioCentavos, item.moneda)}</span>
                            <span className="text-suave">Subtotal</span><span className="cifra text-right">{formatear(subtotalItem(item.cantidad, item.precioUnitarioCentavos), item.moneda)}</span>
                          </div>
                        </div>
                      ))}
                      <p className="break-words border-t border-linea-2 pt-3 text-right text-sm font-semibold">
                        Total de la alternativa: <span className="cifra">{formatear(totales.USD, "USD")} · {formatear(totales.HNL, "HNL")}</span>
                      </p>
                      <p className="break-words text-xs text-suave">{alternativa.notas}</p>
                    </div>
                    <div className="hidden p-4 sm:block">
                      <table className="w-full table-fixed text-sm">
                        <thead>
                          <tr className="text-left text-suave">
                            <th className="pb-2 font-medium">Equipo / servicio</th>
                            <th className="pb-2 text-right font-medium">Cant.</th>
                            <th className="pb-2 text-right font-medium">Precio unitario</th>
                            <th className="pb-2 text-right font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alternativa.items.map((item) => (
                            <tr key={item.descripcion} className="border-t border-linea-2">
                              <td className="py-2 pr-3">{item.descripcion}</td>
                              <td className="cifra py-2 text-right">{item.cantidad}</td>
                              <td className="cifra py-2 text-right">{formatear(item.precioUnitarioCentavos, item.moneda)}</td>
                              <td className="cifra py-2 text-right">{formatear(subtotalItem(item.cantidad, item.precioUnitarioCentavos), item.moneda)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-3 border-t border-linea-2 pt-3 text-right text-sm font-semibold">
                        Total de la alternativa: <span className="cifra">{formatear(totales.USD, "USD")} · {formatear(totales.HNL, "HNL")}</span>
                      </p>
                      <p className="mt-2 text-xs text-suave">{alternativa.notas}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
