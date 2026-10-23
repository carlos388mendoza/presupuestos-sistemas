"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { aCentavos, centavosATexto } from "@/lib/dinero";
import { MENSAJE_ARCHIVO_GRANDE, TAMANO_MAXIMO_ARCHIVO } from "@/lib/limites";
import type { BorradorAlternativa, RespuestaExtraccion } from "@/lib/tipos";
import { guardarAlternativasAgrupadas, type EntradaAlternativasAgrupadas } from "@/actions/presupuestos";

type Partida = { id: string; nombre: string };

export function SubirCotizacionPresupuesto({ presupuestoId, partidas }: { presupuestoId: string; partidas: Partida[] }) {
  const [archivo, setArchivo] = useState<{ id: string; nombre: string } | null>(null);
  const [borrador, setBorrador] = useState<BorradorAlternativa | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [leyendo, setLeyendo] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, iniciarGuardado] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function subir(file?: File) {
    if (!file) return;
    setError(null);
    setAviso(null);
    setBorrador(null);
    if (file.size > TAMANO_MAXIMO_ARCHIVO) return setError(MENSAJE_ARCHIVO_GRANDE);
    setSubiendo(true);
    try {
      const form = new FormData();
      form.append("archivo", file);
      const response = await fetch("/api/cotizaciones/extraer", { method: "POST", body: form });
      const subido = await response.json() as RespuestaExtraccion;
      if (!response.ok || subido.error) throw new Error(subido.error ?? "No se pudo subir el archivo.");
      setArchivo({ id: subido.archivoId, nombre: subido.archivoNombre });
      setSubiendo(false);
      setLeyendo(true);
      const respuestaIA = await fetch(`/api/cotizaciones/${encodeURIComponent(subido.archivoId)}/extraer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presupuestoId }),
      });
      const resultado = await respuestaIA.json() as RespuestaExtraccion;
      if (!respuestaIA.ok || resultado.error) throw new Error(resultado.error ?? "No se pudo leer la cotización.");
      if (!resultado.borrador) throw new Error(resultado.aviso ?? "La IA no encontró productos en el archivo.");
      const destino = resultado.borrador.items.map((item) => item.partidaId ?? partidas[0]!.id);
      setBorrador(resultado.borrador);
      setCategorias(destino);
      setAviso(`Se encontraron ${resultado.borrador.items.length} ítems. Confirma sus partidas y revisa precios antes de guardar.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo procesar la cotización.");
    } finally {
      setSubiendo(false);
      setLeyendo(false);
    }
  }

  function guardar() {
    if (!borrador || !archivo) return;
    setError(null);
    const grupos = new Map<string, EntradaAlternativasAgrupadas["alternativas"][number]["items"]>();
    for (const [index, item] of borrador.items.entries()) {
      const partidaId = categorias[index];
      if (!partidas.some((partida) => partida.id === partidaId)) return setError(`Elige una partida para el ítem ${index + 1}.`);
      const precio = centavosATexto(item.precioUnitarioCentavos);
      const precioCentavos = aCentavos(precio);
      if (precioCentavos === null) return setError(`Revisa el precio del ítem ${index + 1}.`);
      const grupo = grupos.get(partidaId) ?? [];
      grupo.push({
        equipoId: item.equipoId,
        crearEquipo: item.nuevo,
        origenEquipo: "ia",
        descripcion: item.descripcion,
        marca: item.marca,
        modelo: item.modelo,
        cantidad: item.cantidad,
        precioUnitarioCentavos: precioCentavos,
        moneda: item.moneda,
      });
      grupos.set(partidaId, grupo);
    }
    const entrada: EntradaAlternativasAgrupadas = {
      presupuestoId,
      alternativas: [...grupos.entries()].map(([partidaId, items]) => ({
        partidaId,
        proveedor: borrador.proveedor,
        tipoCompra: borrador.tipoCompra,
        notas: "",
        archivoId: archivo.id,
        items,
      })),
    };
    iniciarGuardado(async () => {
      const resultado = await guardarAlternativasAgrupadas(entrada);
      if (resultado?.error) setError(resultado.error);
    });
  }

  return (
    <div className="max-w-4xl space-y-6">
      <section className="panel space-y-4 p-5">
        <label htmlFor="cotizacion" className="etiqueta">Archivo de cotización</label>
        <input
          id="cotizacion"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,.xlsx,.docx"
          className="campo"
          disabled={subiendo || leyendo || guardando}
          onChange={(event) => void subir(event.target.files?.[0])}
        />
        <p className="ayuda">PDF, imagen, Excel (.xlsx) o Word (.docx), máximo 4 MB. Puedes volver a seleccionar un archivo para reemplazarlo.</p>
        {archivo && <p className="text-sm text-suave">Archivo: {archivo.nombre}</p>}
        {(subiendo || leyendo) && (
          <p role="status" className="rounded-md bg-hnl-claro p-3 text-sm text-hnl">
            {subiendo ? "Subiendo el archivo…" : "La IA está leyendo los productos y asignándolos a las partidas…"}
          </p>
        )}
        {aviso && <p role="status" className="text-sm text-suave">{aviso}</p>}
        {error && <p role="alert" className="text-sm text-peligro">{error}</p>}
      </section>

      {borrador && (
        <section className="panel space-y-5 p-5" aria-labelledby="titulo-revision">
          <div>
            <h2 id="titulo-revision" className="font-semibold">Revisa los productos</h2>
            <p className="ayuda">Proveedor: {borrador.proveedor} · Compra {borrador.tipoCompra}</p>
          </div>
          <div className="space-y-4">
            {borrador.items.map((item, index) => (
              <article key={`${item.descripcion}-${index}`} className="grid min-w-0 gap-3 rounded-lg border border-linea p-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
                <div className="min-w-0">
                  <h3 className="break-words font-medium">{item.descripcion}</h3>
                  <p className="text-sm text-suave">{[item.marca, item.modelo].filter(Boolean).join(" · ") || "Sin marca o modelo"}</p>
                  <p className="mt-1 text-sm">{item.cantidad} × {item.moneda} {centavosATexto(item.precioUnitarioCentavos)}</p>
                </div>
                <label className="etiqueta">Partida
                  <select className="campo mt-1" value={categorias[index] ?? ""} onChange={(event) => setCategorias((actual) => actual.map((id, i) => i === index ? event.target.value : id))}>
                    {partidas.map((partida) => <option key={partida.id} value={partida.id}>{partida.nombre}</option>)}
                  </select>
                </label>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primario" disabled={guardando} onClick={guardar}>{guardando ? "Guardando…" : "Guardar cotización"}</button>
            <Link href={`/presupuestos/${presupuestoId}`} className="btn-texto">Cancelar</Link>
          </div>
        </section>
      )}
    </div>
  );
}
