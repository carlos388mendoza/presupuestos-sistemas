import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requerirUsuario } from "@/lib/sesion";
import { ErrorNegocio, obtenerPresupuesto, pendientesParaListo, permisosPresupuesto, type PresupuestoCompleto } from "@/lib/datos";
import { formatear, subtotalItem } from "@/lib/dinero";
import {
  actualizarPresupuesto,
  cambiarEstado,
  crearPartida,
  eliminarAlternativa,
  eliminarPartida,
  eliminarPresupuesto,
  elegirAlternativa,
  renombrarPartida,
} from "@/actions/presupuestos";
import { FormAccion } from "@/components/FormAccion";
import { CampoTexto } from "@/components/campos";
import { ModalFormulario } from "@/components/ModalFormulario";
import { Totales } from "@/components/Totales";
import { Etiqueta } from "@/components/Etiqueta";
import { CamposPresupuesto } from "../CamposPresupuesto";

type Partida = PresupuestoCompleto["partidas"][number];
type Alternativa = Partida["alternativas"][number];

export default async function PaginaPresupuesto({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requerirUsuario();
  const { id } = await params;

  let p: PresupuestoCompleto;
  try {
    p = await obtenerPresupuesto(db, usuario, id);
  } catch (e) {
    if (e instanceof ErrorNegocio) notFound();
    throw e;
  }

  const editable = p.estado === "borrador";
  const permisos = permisosPresupuesto(usuario, p.creadoPor);
  // Lo que se puede hacer ahora: modificar contenido o decidir (elegir, listo/reabrir).
  const modificar = editable && permisos.modificar;
  const decidir = editable && permisos.decidir;
  const pendientes = pendientesParaListo(p);
  const hayInternacional = p.resumen.internacional.USD + p.resumen.internacional.HNL > 0;
  const hayNacional = p.resumen.nacional.USD + p.resumen.nacional.HNL > 0;

  return (
    <>
      <Link href="/presupuestos" className="btn-texto -ml-1.5 mb-2">Volver a presupuestos</Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-suave">
            {p.restaurante} · {p.tipo === "apertura" ? "Apertura" : "Remodelación"} · {p.autor}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="titulo-pagina">{p.nombre}</h1>
            <Etiqueta tipo={p.estado}>{p.estado === "listo" ? "Listo" : "Borrador"}</Etiqueta>
            {modificar && (
              <ModalFormulario
                titulo="Editar presupuesto"
                triggerClassName="btn-texto rounded-full p-2"
                triggerAriaLabel="Editar presupuesto"
                trigger={(
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m13.8 3.7 2.5 2.5M4 16l3.8-.8L16 7a1.8 1.8 0 0 0-2.5-2.5l-8.2 8.2L4 16Z" />
                  </svg>
                )}
              >
                <FormAccion action={actualizarPresupuesto} className="formulario">
                  <input type="hidden" name="id" value={p.id} />
                  <CamposPresupuesto valores={p} />
                  <button type="submit" className="btn-primario self-start">Guardar cambios</button>
                </FormAccion>
                <FormAccion
                  action={eliminarPresupuesto}
                  confirmar="¿Eliminar este presupuesto con todas sus partidas y alternativas? No se puede deshacer."
                  className="mt-6 border-t border-linea-2 pt-4"
                >
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="btn-peligro px-0">Eliminar presupuesto</button>
                </FormAccion>
              </ModalFormulario>
            )}
          </div>
          {p.notas && <p className="ayuda mt-1 max-w-prose whitespace-pre-line">{p.notas}</p>}
        </div>
      </header>

      {/* Totales: solo alternativas elegidas, uno por moneda */}
      <section aria-labelledby="titulo-totales" className="panel mb-8 p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titulo-totales" className="font-semibold">Total con las alternativas elegidas</h2>
          <p className="text-xs text-suave">Sin conversión de moneda</p>
        </div>
        <Totales totales={p.resumen.total} tamano="grande" />
        {(hayNacional || hayInternacional) && (
          <dl className="mt-4 grid gap-x-8 gap-y-1 border-t border-linea-2 pt-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <dt className="text-suave">Compras nacionales</dt>
              <dd><Totales totales={p.resumen.nacional} tamano="compacto" /></dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-suave">Compras internacionales</dt>
              <dd><Totales totales={p.resumen.internacional} tamano="compacto" /></dd>
            </div>
          </dl>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-linea-2 pt-4">
          {editable ? (
            decidir && (
              <>
                <FormAccion action={cambiarEstado} enLinea className="flex flex-wrap items-center">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="estado" value="listo" />
                  <button type="submit" className="btn-primario" disabled={pendientes.length > 0}>
                    Marcar como listo
                  </button>
                </FormAccion>
                {pendientes.length > 0 && (
                  <p className="text-sm text-aviso">
                    {pendientes.length === 1 ? pendientes[0] : `Faltan ${pendientes.length} partidas por decidir.`}
                  </p>
                )}
              </>
            )
          ) : (
            <>
              <a href={`/api/presupuestos/${p.id}/excel`} className="btn-primario" download>
                Descargar Excel
              </a>
              {permisos.decidir && (
                <FormAccion action={cambiarEstado} enLinea className="flex items-center">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="estado" value="borrador" />
                  <button type="submit" className="btn-secundario">Reabrir para editar</button>
                </FormAccion>
              )}
              <p className="ayuda">Descarga el archivo y envíalo a Proyectos por correo.</p>
            </>
          )}
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-linea pb-2">
        <h2 className="text-lg font-semibold">Partidas</h2>
        {modificar && (
          <ModalFormulario
            titulo="Nueva partida"
            triggerClassName="btn-texto rounded-full p-2"
            triggerAriaLabel="Agregar partida"
            trigger={(
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 4v12M4 10h12" />
              </svg>
            )}
          >
            <FormAccion action={crearPartida} limpiarAlTerminar className="formulario">
              <input type="hidden" name="presupuestoId" value={p.id} />
              <CampoTexto id="nueva-partida" name="nombre" etiqueta="Nombre de la partida" required maxLength={120}
                placeholder="Ej. Pantallas de cocina" />
              <button type="submit" className="btn-primario self-start">Agregar partida</button>
            </FormAccion>
          </ModalFormulario>
        )}
      </div>

      <div className="space-y-10">
        {p.partidas.map((pa) => (
          <SeccionPartida key={pa.id} presupuestoId={p.id} partida={pa} modificar={modificar} decidir={decidir} />
        ))}
      </div>
    </>
  );
}

type Permisos = { modificar: boolean; decidir: boolean };

function SeccionPartida({ presupuestoId, partida, modificar, decidir }: { presupuestoId: string; partida: Partida } & Permisos) {
  const elegida = partida.alternativas.find((a) => a.elegida);
  return (
    <section id={`partida-${partida.id}`} aria-labelledby={`t-${partida.id}`} className="scroll-mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-linea pb-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id={`t-${partida.id}`} className="text-lg font-semibold">{partida.nombre}</h2>
          {!elegida && partida.alternativas.length > 0 && <Etiqueta tipo="aviso">Sin elegir</Etiqueta>}
        </div>
        {modificar && (
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/presupuestos/${presupuestoId}/alternativas/nueva?partida=${partida.id}`} className="btn-secundario">
              Agregar alternativa
            </Link>
            <details className="relative">
              <summary className="btn-texto cursor-pointer list-none">Opciones</summary>
              <div className="panel absolute right-0 z-10 mt-1 w-72 space-y-3 p-4 shadow-lg">
                <FormAccion action={renombrarPartida}>
                  <input type="hidden" name="id" value={partida.id} />
                  <label className="etiqueta" htmlFor={`r-${partida.id}`}>Nombre</label>
                  <div className="flex gap-2">
                    <input id={`r-${partida.id}`} name="nombre" defaultValue={partida.nombre} required maxLength={120} className="campo" />
                    <button className="btn-secundario">Guardar</button>
                  </div>
                </FormAccion>
                <FormAccion
                  action={eliminarPartida}
                  confirmar={`¿Eliminar la partida "${partida.nombre}" y sus alternativas?`}
                >
                  <input type="hidden" name="id" value={partida.id} />
                  <button className="btn-peligro px-0">Eliminar partida</button>
                </FormAccion>
              </div>
            </details>
          </div>
        )}
      </div>

      {partida.alternativas.length === 0 ? (
        <p className="ayuda">
          Sin cotizaciones todavía.{" "}
          {modificar && (
            <Link href={`/presupuestos/${presupuestoId}/alternativas/nueva?partida=${partida.id}`} className="underline">
              Sube una cotización o ingrésala a mano.
            </Link>
          )}
        </p>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {partida.alternativas.map((a) => (
            <TarjetaAlternativa key={a.id} presupuestoId={presupuestoId} a={a} modificar={modificar} decidir={decidir} />
          ))}
        </div>
      )}
    </section>
  );
}

function TarjetaAlternativa({ presupuestoId, a, modificar, decidir }: { presupuestoId: string; a: Alternativa } & Permisos) {
  return (
    <article
      className={`flex min-w-0 max-w-full flex-col overflow-hidden rounded-lg bg-papel ${a.elegida ? "border-2 border-tinta" : "border border-linea"}`}
      aria-label={`Alternativa de ${a.proveedor}${a.elegida ? ", elegida" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{a.proveedor}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Etiqueta tipo={a.tipoCompra}>{a.tipoCompra === "nacional" ? "Nacional" : "Internacional"}</Etiqueta>
            {a.archivoId && (
              <a href={`/api/archivos/${a.archivoId}`} target="_blank" rel="noopener" className="max-w-full break-all text-xs text-hnl underline">
                {a.archivoNombre ?? "Ver cotización"}
              </a>
            )}
          </div>
        </div>
        {a.elegida && (
          <span className="shrink-0 rounded bg-tinta px-2 py-0.5 text-xs font-semibold text-white">Elegida</span>
        )}
      </div>

      <ul className="min-w-0 flex-1 divide-y divide-linea-2 border-t border-linea-2 text-sm">
        {a.items.map((it) => (
          <li key={it.id} className="flex min-w-0 justify-between gap-3 px-4 py-2">
            <div className="min-w-0">
              <div className="break-words" title={it.descripcion}>{it.descripcion}</div>
              <div className="cifra text-xs text-suave">
                {it.cantidad} × {formatear(it.precioUnitarioCentavos, it.moneda)}
                {!it.equipoId && " · sin vincular al catálogo"}
              </div>
            </div>
            <div className={`cifra shrink-0 ${it.moneda === "USD" ? "text-usd" : "text-hnl"}`}>
              {formatear(subtotalItem(it.cantidad, it.precioUnitarioCentavos), it.moneda)}
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-linea-2 px-4 py-3">
        <div className="flex justify-between text-sm">
          <span className="text-suave">Total</span>
          <Totales totales={a.totales} tamano="compacto" />
        </div>
        {a.notas && <p className="mt-2 text-xs text-suave">{a.notas}</p>}
      </div>

      {(decidir || modificar) && (
        <div className="flex flex-wrap items-center gap-1 border-t border-linea-2 px-3 py-2">
          {decidir && (
            <FormAccion action={elegirAlternativa} enLinea className="flex items-center">
              <input type="hidden" name="id" value={a.id} />
              {a.elegida ? (
                <>
                  <input type="hidden" name="quitar" value="1" />
                  <button className="btn-texto">Quitar elección</button>
                </>
              ) : (
                <button className="btn-secundario py-1.5">Elegir esta</button>
              )}
            </FormAccion>
          )}
          {modificar && (
            <>
              <Link href={`/presupuestos/${presupuestoId}/alternativas/${a.id}`} className="btn-texto">Editar</Link>
              <FormAccion
                action={eliminarAlternativa}
                confirmar={`¿Eliminar la alternativa de ${a.proveedor}?`}
                enLinea
                className="ml-auto flex items-center"
              >
                <input type="hidden" name="id" value={a.id} />
                <button className="btn-peligro">Eliminar</button>
              </FormAccion>
            </>
          )}
        </div>
      )}
    </article>
  );
}
