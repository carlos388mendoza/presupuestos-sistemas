import Link from "next/link";
import { db } from "@/db";
import { requerirUsuario } from "@/lib/sesion";
import { listarPresupuestos, puedeCrearPresupuestos, puedeVerTodo } from "@/lib/datos";
import { formatear } from "@/lib/dinero";
import { Etiqueta } from "@/components/Etiqueta";

const fecha = new Intl.DateTimeFormat("es-HN", { day: "numeric", month: "short", year: "numeric" });

export default async function PaginaPresupuestos() {
  const usuario = await requerirUsuario();
  const lista = await listarPresupuestos(db, usuario);
  const verTodo = puedeVerTodo(usuario);
  const puedeCrear = puedeCrearPresupuestos(usuario);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo-pagina">Presupuestos</h1>
          <p className="ayuda">
            {verTodo ? "Todos los presupuestos del departamento." : "Tus presupuestos de aperturas y remodelaciones."}
          </p>
        </div>
        {puedeCrear && <Link href="/presupuestos/nuevo" className="btn-primario">Nuevo presupuesto</Link>}
      </div>

      {lista.length === 0 ? (
        <div className="panel p-8">
          <h2 className="font-semibold">Todavía no hay presupuestos</h2>
          {puedeCrear ? (
            <>
              <p className="ayuda mt-1 max-w-prose">
                Crea uno por cada apertura o remodelación. Dentro agregas las partidas (por ejemplo, red, puntos de venta o
                cámaras) y las cotizaciones de cada proveedor.
              </p>
              <Link href="/presupuestos/nuevo" className="btn-primario mt-4">Crear el primero</Link>
            </>
          ) : (
            <p className="ayuda mt-1 max-w-prose">
              Aquí aparecerán los presupuestos del departamento para que elijas las alternativas.
            </p>
          )}
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-linea text-left text-suave">
                <th className="px-4 py-3 font-medium">Presupuesto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Dólares</th>
                <th className="px-4 py-3 text-right font-medium">Lempiras</th>
                <th className="px-4 py-3 font-medium">{verTodo ? "Creado por" : "Actualizado"}</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className="border-b border-linea-2 last:border-0 hover:bg-fondo/60">
                  <td className="px-4 py-3">
                    <Link href={`/presupuestos/${p.id}`} className="font-semibold hover:underline">
                      {p.nombre}
                    </Link>
                    <div className="text-suave">
                      {p.restaurante} · {p.tipo === "apertura" ? "Apertura" : "Remodelación"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Etiqueta tipo={p.estado}>{p.estado === "listo" ? "Listo" : "Borrador"}</Etiqueta>
                  </td>
                  <td className="cifra px-4 py-3 text-right text-usd">{formatear(p.resumen.total.USD, "USD")}</td>
                  <td className="cifra px-4 py-3 text-right text-hnl">{formatear(p.resumen.total.HNL, "HNL")}</td>
                  <td className="px-4 py-3 text-suave">
                    {verTodo ? p.autor : fecha.format(p.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
