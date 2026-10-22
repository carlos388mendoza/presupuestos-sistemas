"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { Moneda, TipoCompra } from "@/db/schema";
import { aCentavos, centavosATexto, formatear, subtotalItem, totalesVacios } from "@/lib/dinero";
import type { BorradorAlternativa, RespuestaExtraccion } from "@/lib/tipos";
import { MENSAJE_ARCHIVO_GRANDE, TAMANO_MAXIMO_ARCHIVO } from "@/lib/limites";
import { GrupoOpciones } from "@/components/campos";
import type { EquipoOpcion } from "@/components/campos";
import { guardarAlternativa, type EntradaAlternativa } from "@/actions/presupuestos";
import { Etiqueta } from "@/components/Etiqueta";
import { SelectorEquipo } from "@/components/campos/SelectorEquipo";
import { DialogoConfirmar } from "@/components/DialogoConfirmar";

type Fila = {
  clave: string;
  /** "" = sin vincular, "__nuevo__" = crear en el catálogo, otro = id del equipo */
  equipo: string;
  origenNuevo: "manual" | "ia";
  descripcion: string;
  marca: string;
  modelo: string;
  cantidad: string;
  precio: string;
  moneda: Moneda;
};

export type ValoresIniciales = {
  id?: string;
  proveedor: string;
  tipoCompra: TipoCompra;
  notas: string;
  archivo: { id: string; nombre: string } | null;
  items: {
    equipoId: string | null;
    descripcion: string;
    cantidad: number;
    precioUnitarioCentavos: number;
    moneda: Moneda;
  }[];
};

const NUEVO = "__nuevo__";
let contador = 0;
const clave = () => `f${++contador}`;

function filaVacia(moneda: Moneda): Fila {
  return { clave: clave(), equipo: "", origenNuevo: "manual", descripcion: "", marca: "", modelo: "", cantidad: "1", precio: "", moneda };
}

function filaEstaVacia(f: Fila) {
  return !f.descripcion.trim() && !f.precio.trim() && !f.equipo;
}

export function EditorAlternativa({
  presupuestoId,
  partida,
  catalogo,
  iniciales,
}: {
  presupuestoId: string;
  partida: { id: string; nombre: string };
  catalogo: EquipoOpcion[];
  iniciales?: ValoresIniciales;
}) {
  const porId = useMemo(() => new Map(catalogo.map((e) => [e.id, e])), [catalogo]);

  const [proveedor, setProveedor] = useState(iniciales?.proveedor ?? "");
  const [tipoCompra, setTipoCompra] = useState<TipoCompra>(iniciales?.tipoCompra ?? "nacional");
  const [notas, setNotas] = useState(iniciales?.notas ?? "");
  const [archivo, setArchivo] = useState(iniciales?.archivo ?? null);
  const [filas, setFilas] = useState<Fila[]>(() =>
    iniciales?.items.length
      ? iniciales.items.map((it) => {
          const e = it.equipoId ? porId.get(it.equipoId) : undefined;
          return {
            clave: clave(),
            equipo: e ? e.id : "",
            origenNuevo: "manual",
            descripcion: it.descripcion,
            marca: e?.marca ?? "",
            modelo: e?.modelo ?? "",
            cantidad: String(it.cantidad),
            precio: centavosATexto(it.precioUnitarioCentavos),
            moneda: it.moneda,
          };
        })
      : [filaVacia("HNL")],
  );

  const [leyendo, setLeyendo] = useState(false);
  const [arrastrandoArchivo, setArrastrandoArchivo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [borradorPendiente, setBorradorPendiente] = useState<BorradorAlternativa | null>(null);
  const [guardando, iniciarGuardado] = useTransition();
  const inputArchivo = useRef<HTMLInputElement>(null);

  const totales = useMemo(() => {
    const t = totalesVacios();
    for (const f of filas) {
      const c = Number(f.cantidad);
      const p = aCentavos(f.precio);
      if (Number.isFinite(c) && c > 0 && p !== null) t[f.moneda] += subtotalItem(c, p);
    }
    return t;
  }, [filas]);

  const cambiarFila = (k: string, cambios: Partial<Fila>) =>
    setFilas((fs) => fs.map((f) => (f.clave === k ? { ...f, ...cambios } : f)));

  function elegirEquipo(f: Fila, valor: string) {
    const e = porId.get(valor);
    if (e) {
      cambiarFila(f.clave, {
        equipo: valor,
        descripcion: f.descripcion.trim() ? f.descripcion : e.nombre,
        marca: e.marca,
        modelo: e.modelo,
      });
    } else {
      cambiarFila(f.clave, { equipo: valor, origenNuevo: "manual" });
    }
  }

  function aplicarBorrador(b: BorradorAlternativa, reemplazar = false) {
    const nuevas: Fila[] = b.items.map((it) => ({
      clave: clave(),
      equipo: it.equipoId ?? (it.nuevo ? NUEVO : ""),
      origenNuevo: "ia",
      descripcion: it.descripcion,
      marca: it.marca,
      modelo: it.modelo,
      cantidad: String(it.cantidad),
      precio: centavosATexto(it.precioUnitarioCentavos),
      moneda: it.moneda,
    }));
    const soloVacias = filas.every(filaEstaVacia);
    if (!soloVacias && !reemplazar) {
      setBorradorPendiente(b);
      return;
    }
    setFilas(nuevas.length ? nuevas : [filaVacia("HNL")]);
    if (!proveedor.trim()) setProveedor(b.proveedor);
    setTipoCompra(b.tipoCompra);
  }

  async function leerCotizacion(file: File) {
    setAviso(null);
    setError(null);
    if (file.size > TAMANO_MAXIMO_ARCHIVO) {
      setError(MENSAJE_ARCHIVO_GRANDE);
      if (inputArchivo.current) inputArchivo.current.value = "";
      return;
    }
    setLeyendo(true);
    try {
      const fd = new FormData();
      fd.append("archivo", file);
      const res = await fetch("/api/cotizaciones/extraer", { method: "POST", body: fd });
      if (res.status === 413) {
        setError(MENSAJE_ARCHIVO_GRANDE);
        return;
      }
      const r = (await res.json()) as RespuestaExtraccion;
      if (!res.ok || r.error) {
        setError(r.error ?? "No se pudo subir el archivo.");
        return;
      }
      setArchivo({ id: r.archivoId, nombre: r.archivoNombre });
      if (r.borrador) {
        aplicarBorrador(r.borrador);
        const nuevos = r.borrador.items.filter((i) => i.nuevo).length;
        setAviso(
          `Se leyeron ${r.borrador.items.length} ítems. Revisa proveedor, cantidades, precios y monedas antes de guardar.` +
            (nuevos ? ` ${nuevos} no están en el catálogo y se agregarán al guardar.` : ""),
        );
      } else if (r.aviso) {
        setAviso(r.aviso);
      }
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setLeyendo(false);
      if (inputArchivo.current) inputArchivo.current.value = "";
    }
  }

  function soltarArchivo(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastrandoArchivo(false);
    if (leyendo) return;
    const file = e.dataTransfer.files[0];
    if (file) void leerCotizacion(file);
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const usadas = filas.filter((f) => !filaEstaVacia(f));
    if (usadas.length === 0) return setError("Agrega al menos un ítem.");

    const items: EntradaAlternativa["items"] = [];
    for (const [i, f] of usadas.entries()) {
      const n = i + 1;
      const cantidad = Number(f.cantidad);
      const precio = aCentavos(f.precio);
      if (!f.descripcion.trim()) return setError(`Escribe la descripción del ítem ${n}.`);
      if (!Number.isFinite(cantidad) || cantidad <= 0) return setError(`Revisa la cantidad del ítem ${n}.`);
      if (precio === null || precio < 0) return setError(`Revisa el precio del ítem ${n}.`);
      const equipoId = f.equipo && f.equipo !== NUEVO ? f.equipo : null;
      items.push({
        equipoId,
        crearEquipo: f.equipo === NUEVO,
        origenEquipo: f.origenNuevo,
        descripcion: f.descripcion.trim(),
        marca: f.marca.trim(),
        modelo: f.modelo.trim(),
        cantidad,
        precioUnitarioCentavos: precio,
        moneda: f.moneda,
      });
    }

    iniciarGuardado(async () => {
      const r = await guardarAlternativa({
        id: iniciales?.id,
        partidaId: partida.id,
        proveedor,
        tipoCompra,
        notas,
        archivoId: archivo?.id ?? null,
        items,
      });
      if (r?.error) setError(r.error);
    });
  }

  const ultimaMoneda = filas.at(-1)?.moneda ?? (tipoCompra === "internacional" ? "USD" : "HNL");

  return (
    <form onSubmit={guardar} className="space-y-6">
      <DialogoConfirmar abierto={!!borradorPendiente} titulo="Reemplazar los ítems actuales?"
        descripcion="La cotización trae ítems nuevos. Puedes reemplazar los que ya tienes en la tabla."
        textoConfirmar="Reemplazar ítems" onCancelar={() => setBorradorPendiente(null)}
        onConfirmar={() => { if (borradorPendiente) aplicarBorrador(borradorPendiente, true); setBorradorPendiente(null); }} />
      {/* Subida y lectura de la cotización */}
      <section className="panel p-5" aria-labelledby="t-archivo">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="t-archivo" className="font-semibold">Cotización del proveedor</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-hnl-claro px-2.5 py-1 text-xs font-medium text-hnl">
                <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z"/>
                </svg>
                Lectura con IA
              </span>
            </div>
            <p className="ayuda">
              Suelta un PDF o una foto para extraer proveedor, productos, cantidades y precios. Revisa los datos antes de guardar.
            </p>
          </div>
        </div>
        <div
          onDragEnter={(e) => { e.preventDefault(); if (!leyendo) setArrastrandoArchivo(true); }}
          onDragOver={(e) => { e.preventDefault(); if (!leyendo) setArrastrandoArchivo(true); }}
          onDragLeave={(e) => { e.preventDefault(); setArrastrandoArchivo(false); }}
          onDrop={soltarArchivo}
          className={`mt-4 flex min-h-36 flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            leyendo ? "cursor-wait border-linea bg-fondo opacity-70" : arrastrandoArchivo ? "border-hnl bg-hnl-claro" : "border-linea hover:border-hnl hover:bg-fondo"
          }`}
        >
          <input
            ref={inputArchivo}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            id="archivo"
            onChange={(e) => e.target.files?.[0] && leerCotizacion(e.target.files[0])}
            disabled={leyendo}
          />
          <svg aria-hidden="true" className="mb-2 size-7 text-hnl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M20 16.5v2A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-2"/>
          </svg>
          <p className="text-sm font-medium">{leyendo ? "Leyendo cotización…" : arrastrandoArchivo ? "Suelta el archivo para subirlo" : "Arrastra y suelta tu cotización aquí"}</p>
          <p className="mt-1 text-xs text-suave">PDF, JPG, PNG o WEBP · máximo 4 MB</p>
          <label
            htmlFor="archivo"
            aria-disabled={leyendo}
            className={`mt-3 btn-secundario cursor-pointer ${leyendo ? "pointer-events-none opacity-60" : ""}`}
          >
            {archivo ? "Elegir otra cotización" : "Seleccionar archivo"}
          </label>
        </div>
        {archivo && (
          <p className="mt-3 text-sm">
            Archivo adjunto:{" "}
            <a href={`/api/archivos/${archivo.id}`} target="_blank" rel="noopener" className="text-hnl underline">
              {archivo.nombre}
            </a>{" "}
            <button type="button" className="btn-texto" onClick={() => setArchivo(null)}>Quitar</button>
          </p>
        )}
        {leyendo && <p className="mt-3 text-sm text-suave" role="status">Esto puede tardar hasta un minuto.</p>}
        {aviso && <p className="mt-3 rounded-md bg-aviso-claro px-3 py-2 text-sm text-aviso" role="status">{aviso}</p>}
      </section>

      {/* Datos generales */}
      <section className="panel grid gap-4 p-5 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="proveedor" className="etiqueta">Proveedor</label>
          <input id="proveedor" required maxLength={150} className="campo" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
        </div>
        <GrupoOpciones<TipoCompra>
          name="tipoCompra"
          etiqueta="Tipo de compra"
          value={tipoCompra}
          onChange={setTipoCompra}
          enColumnas={false}
          opciones={[
            { valor: "nacional", etiqueta: "Nacional", descripcion: "Proveedor en Honduras." },
            { valor: "internacional", etiqueta: "Internacional", descripcion: "Proveedor del exterior." },
          ]}
        />
        <div className="sm:col-span-2">
          <label htmlFor="notas" className="etiqueta">Notas <span className="font-normal text-suave">(opcional)</span></label>
          <input id="notas" maxLength={2000} className="campo" value={notas} onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej. Tiempo de entrega 4 semanas, incluye instalación" />
        </div>
      </section>

      {/* Ítems */}
      <section className="panel" aria-labelledby="t-items">
        <div className="flex items-center justify-between border-b border-linea-2 px-5 py-3">
          <h2 id="t-items" className="font-semibold">Ítems</h2>
          <p className="ayuda hidden sm:block">Cada precio queda en su moneda; no se convierten.</p>
        </div>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="text-left text-suave">
                <th className="px-3 py-2 font-medium">Equipo del catálogo</th>
                <th className="px-3 py-2 font-medium">Descripción</th>
                <th className="px-3 py-2 font-medium">Marca</th>
                <th className="px-3 py-2 font-medium">Modelo</th>
                <th className="w-20 px-3 py-2 font-medium">Cant.</th>
                <th className="w-32 px-3 py-2 font-medium">Precio unit.</th>
                <th className="w-24 px-3 py-2 font-medium">Moneda</th>
                <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                <th className="w-10"><span className="sr-only">Quitar</span></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => {
                const c = Number(f.cantidad);
                const p = aCentavos(f.precio);
                const sub = Number.isFinite(c) && c > 0 && p !== null ? subtotalItem(c, p) : null;
                const vinculado = f.equipo && f.equipo !== NUEVO;
                return (
                  <tr key={f.clave} className="border-t border-linea-2 align-top">
                    <td className="px-3 py-2">
                      <SelectorEquipo
                        opciones={catalogo}
                        value={f.equipo}
                        etiqueta={`Equipo del ítem ${i + 1}`}
                        onChange={(valor) => elegirEquipo(f, valor)}
                      />
                      {f.equipo === NUEVO && (
                        <div className="mt-1">
                          <Etiqueta tipo="nuevo">Nuevo en el catálogo</Etiqueta>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input aria-label={`Descripción del ítem ${i + 1}`} className="campo" value={f.descripcion}
                        onChange={(e) => cambiarFila(f.clave, { descripcion: e.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <input aria-label={`Marca del ítem ${i + 1}`} className="campo" value={f.marca} disabled={!!vinculado}
                        onChange={(e) => cambiarFila(f.clave, { marca: e.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <input aria-label={`Modelo del ítem ${i + 1}`} className="campo" value={f.modelo} disabled={!!vinculado}
                        onChange={(e) => cambiarFila(f.clave, { modelo: e.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <input aria-label={`Cantidad del ítem ${i + 1}`} className="campo cifra" inputMode="decimal" value={f.cantidad}
                        onChange={(e) => cambiarFila(f.clave, { cantidad: e.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <input aria-label={`Precio unitario del ítem ${i + 1}`} className="campo cifra" inputMode="decimal" placeholder="0.00"
                        value={f.precio} onChange={(e) => cambiarFila(f.clave, { precio: e.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <select aria-label={`Moneda del ítem ${i + 1}`} className="campo" value={f.moneda}
                        onChange={(e) => cambiarFila(f.clave, { moneda: e.target.value as Moneda })}>
                        <option value="HNL">HNL</option>
                        <option value="USD">USD</option>
                      </select>
                    </td>
                    <td className={`cifra px-3 py-2 pt-4 text-right ${f.moneda === "USD" ? "text-usd" : "text-hnl"}`}>
                      {sub === null ? "—" : formatear(sub, f.moneda)}
                    </td>
                    <td className="px-1 py-2 pt-3">
                      <button
                        type="button"
                        className="btn-peligro"
                        aria-label={`Quitar ítem ${i + 1}`}
                        onClick={() => setFilas((fs) => (fs.length > 1 ? fs.filter((x) => x.clave !== f.clave) : [filaVacia(f.moneda)]))}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-linea-2 px-5 py-3">
          <button type="button" className="btn-secundario" onClick={() => setFilas((fs) => [...fs, filaVacia(ultimaMoneda)])}>
            Agregar ítem
          </button>
          <div className="cifra flex gap-6 text-sm">
            <span>Total <strong className="text-usd">{formatear(totales.USD, "USD")}</strong></span>
            <span><strong className="text-hnl">{formatear(totales.HNL, "HNL")}</strong></span>
          </div>
        </div>
      </section>

      {error && <p role="alert" className="rounded-md bg-peligro-claro px-3 py-2 text-sm text-peligro">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primario" disabled={guardando || leyendo}>
          {guardando ? "Guardando…" : iniciales?.id ? "Guardar cambios" : "Guardar alternativa"}
        </button>
        <Link href={`/presupuestos/${presupuestoId}#partida-${partida.id}`} className="btn-texto">Cancelar</Link>
      </div>
    </form>
  );
}
