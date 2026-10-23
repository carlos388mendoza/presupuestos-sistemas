import Link from "next/link";
import { db } from "@/db";
import { requerirUsuario } from "@/lib/sesion";
import { listarPresupuestos, puedeCrearPresupuestos, puedeVerTodo } from "@/lib/datos";
import { formatear, resumenPresupuesto } from "@/lib/dinero";
import { ejemploCafeteriaLaCeiba } from "@/lib/ejemplo-cafeteria";
import { Etiqueta } from "@/components/Etiqueta";
import { FilaPresupuesto } from "./FilaPresupuesto";

const fecha = new Intl.DateTimeFormat("es-HN", { day: "numeric", month: "short", year: "numeric" });

export default async function PaginaPresupuestos({ searchParams }: { searchParams: Promise<{ buscar?: string }> }) {
  const { buscar: termino = "" } = await searchParams;
  const usuario = await requerirUsuario();
  const presupuestosGuardados = await listarPresupuestos(db, usuario);
  const lista = [
    {
      id: ejemploCafeteriaLaCeiba.id,
      nombre: ejemploCafeteriaLaCeiba.nombre,
      restaurante: ejemploCafeteriaLaCeiba.restaurante,
      tipo: ejemploCafeteriaLaCeiba.tipo,
      estado: ejemploCafeteriaLaCeiba.estado,
      updatedAt: new Date("2026-10-22T00:00:00Z"),
      creadoPor: "ejemplo-ficticio",
      autor: "Ejemplo ficticio",
      resumen: resumenPresupuesto(ejemploCafeteriaLaCeiba.partidas),
      partidas: ejemploCafeteriaLaCeiba.partidas.length,
      textoBusqueda: [ejemploCafeteriaLaCeiba.nombre, ejemploCafeteriaLaCeiba.restaurante, "ejemplo ficticio", ...ejemploCafeteriaLaCeiba.partidas.flatMap((p) => [p.nombre, ...p.alternativas.flatMap((a) => [a.proveedor, ...a.items.map((i) => i.descripcion)])])].join(" ").toLocaleLowerCase("es-HN"),
    },
    ...presupuestosGuardados.filter((p) => p.id !== ejemploCafeteriaLaCeiba.id),
  ];
  const consulta = termino.trim().toLocaleLowerCase("es-HN");
  const resultados = consulta ? lista.filter((p) => p.textoBusqueda.includes(consulta)) : lista;
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
        {puedeCrear && <Link href="/presupuestos/nuevo" className="btn-primario hidden xl:inline-flex">Nuevo presupuesto</Link>}
      </div>

      {consulta && <p className="ayuda mb-3">{resultados.length} {resultados.length === 1 ? "resultado" : "resultados"} para “{termino}”</p>}

      {lista.length === 0 ? (
        <div className="panel p-8">
          <h2 className="font-semibold">Todavía no hay presupuestos</h2>
          {puedeCrear ? (
            <>
              <p className="ayuda mt-1 max-w-prose">
                Crea uno por cada apertura o remodelación. Dentro agregas las partidas (por ejemplo, red, puntos de venta o
                cámaras) y las cotizaciones de cada proveedor.
              </p>
              <Link href="/presupuestos/nuevo" className="btn-primario mt-4 hidden xl:inline-flex">Crear el primero</Link>
            </>
          ) : (
            <p className="ayuda mt-1 max-w-prose">
              Aquí aparecerán los presupuestos del departamento para que elijas las alternativas.
            </p>
          )}
        </div>
      ) : resultados.length === 0 ? (
        <div className="panel p-8 text-center"><p className="font-semibold">No encontramos coincidencias</p><p className="ayuda mt-1">Prueba con otro nombre, proveedor, partida o equipo.</p></div>
      ) : (
        <>
        <div className="grid gap-3 xl:hidden">
          {resultados.map((p) => <Link key={p.id} href={`/presupuestos/${p.id}`} className="panel block p-4 transition-colors hover:bg-papel">
            <div className="flex min-w-0 items-start justify-between gap-3"><span className="min-w-0 break-words font-semibold">{p.nombre}{p.id === ejemploCafeteriaLaCeiba.id && " · Ejemplo"}</span><span className="shrink-0"><Etiqueta tipo={p.estado}>{p.estado === "listo" ? "Listo" : "Borrador"}</Etiqueta></span></div>
            <p className="mt-1 break-words text-sm text-suave">{p.restaurante} · {p.tipo === "apertura" ? "Apertura" : "Remodelación"}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm"><span className="cifra text-usd">{formatear(p.resumen.total.USD, "USD")}</span><span className="cifra text-hnl">{formatear(p.resumen.total.HNL, "HNL")}</span></div>
            <p className="mt-2 text-xs text-suave">{verTodo ? `Creado por ${p.autor}` : `Actualizado ${fecha.format(p.updatedAt)}`}</p>
          </Link>)}
        </div>
        <div className="panel relative hidden overflow-x-auto xl:block">
          <table className="w-full text-sm">
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
              {resultados.map((p) => (
                <FilaPresupuesto key={p.id} href={`/presupuestos/${p.id}`} nombre={p.nombre}>
                  <td className="px-4 py-3">
                    <Link href={`/presupuestos/${p.id}`} className="font-semibold hover:underline">
                      {p.nombre}{p.id === ejemploCafeteriaLaCeiba.id && " · Ejemplo"}
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
                </FilaPresupuesto>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </>
  );
}
