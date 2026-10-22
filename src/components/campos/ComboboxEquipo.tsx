"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type EquipoOpcion = { id: string; nombre: string; marca: string; modelo: string };

type Props = {
  catalogo: EquipoOpcion[];
  /** Valor controlado: id del equipo, "" (sin vincular) o "__nuevo__". */
  value?: string;
  /** Valor inicial cuando no es controlado. */
  defaultValue?: string;
  /** Se llama al elegir una opción. */
  onChange?: (valor: string) => void;
  /** Si se indica, se renderiza un input oculto con ese name para formularios. */
  name?: string;
  ariaLabel?: string;
  className?: string;
};

const NUEVO = "__nuevo__";

function etiquetaDe(valor: string, catalogo: EquipoOpcion[]) {
  if (valor === "") return "Sin vincular";
  if (valor === NUEVO) return "Agregar al catálogo";
  const e = catalogo.find((x) => x.id === valor);
  return e ? `${e.nombre}${e.modelo ? ` (${e.modelo})` : ""}` : "Sin vincular";
}

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function ComboboxEquipo({
  catalogo,
  value,
  defaultValue = "",
  onChange,
  name,
  ariaLabel,
  className,
}: Props) {
  const id = useId();
  const idLista = `${id}-lista`;
  const [interno, setInterno] = useState(defaultValue);
  const seleccionado = value !== undefined ? value : interno;

  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const contenedor = useRef<HTMLDivElement>(null);
  const inputBusqueda = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function cerrarFuera(evento: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", cerrarFuera);
    return () => document.removeEventListener("mousedown", cerrarFuera);
  }, [abierto]);

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return catalogo;
    return catalogo.filter((e) => {
      const texto = normalizar(`${e.nombre} ${e.marca} ${e.modelo}`);
      return texto.includes(q);
    });
  }, [catalogo, busqueda]);

  function elegir(valorNuevo: string) {
    if (value === undefined) setInterno(valorNuevo);
    onChange?.(valorNuevo);
    setAbierto(false);
  }

  return (
    <div ref={contenedor} className={`relative ${className ?? ""}`}>
      {name && <input type="hidden" name={name} value={seleccionado} />}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-controls={idLista}
        className="campo flex items-center justify-between gap-2 text-left"
        onClick={() => {
          setBusqueda("");
          setAbierto((a) => {
            const nuevo = !a;
            if (nuevo) window.setTimeout(() => inputBusqueda.current?.focus(), 0);
            return nuevo;
          });
        }}
      >
        <span className="truncate">{etiquetaDe(seleccionado, catalogo)}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`size-4 shrink-0 text-suave transition-transform ${abierto ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {abierto && (
        <div
          className="panel absolute z-20 mt-1 w-full min-w-48 p-2 shadow-lg"
          role="listbox"
          aria-label={ariaLabel ?? "Equipos del catálogo"}
        >
          <input
            ref={inputBusqueda}
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar equipo…"
            className="campo mb-2"
            aria-label="Buscar equipo"
          />
          <ul id={idLista} className="max-h-60 overflow-y-auto">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={seleccionado === ""}
                className={`w-full rounded px-3 py-2 text-left text-sm hover:bg-fondo ${
                  seleccionado === "" ? "bg-fondo font-medium" : ""
                }`}
                onClick={() => elegir("")}
              >
                Sin vincular
              </button>
            </li>
            <li>
              <button
                type="button"
                role="option"
                aria-selected={seleccionado === NUEVO}
                className={`w-full rounded px-3 py-2 text-left text-sm hover:bg-fondo ${
                  seleccionado === NUEVO ? "bg-fondo font-medium" : ""
                }`}
                onClick={() => elegir(NUEVO)}
              >
                Agregar al catálogo
              </button>
            </li>
            {filtrados.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={seleccionado === e.id}
                  className={`w-full rounded px-3 py-2 text-left text-sm hover:bg-fondo ${
                    seleccionado === e.id ? "bg-fondo font-medium" : ""
                  }`}
                  onClick={() => elegir(e.id)}
                >
                  {e.nombre}
                  {e.modelo ? ` (${e.modelo})` : ""}
                  {e.marca && <span className="text-suave"> · {e.marca}</span>}
                </button>
              </li>
            ))}
            {filtrados.length === 0 && (
              <li className="px-3 py-2 text-sm text-suave">Sin coincidencias.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}