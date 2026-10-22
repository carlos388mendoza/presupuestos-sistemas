"use client";

import { useId, useMemo, useRef, useState } from "react";

type Opcion = { id: string; nombre: string; marca: string; modelo: string };

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

/** Selector con búsqueda para vincular un ítem al catálogo sin recorrer una lista larga. */
export function SelectorEquipo({
  opciones,
  value,
  onChange,
  etiqueta,
}: {
  opciones: Opcion[];
  value: string;
  onChange: (value: string) => void;
  etiqueta: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [consulta, setConsulta] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(0);
  const actual = opciones.find((opcion) => opcion.id === value);
  const etiquetaActual = actual ? `${actual.nombre}${actual.modelo ? ` (${actual.modelo})` : ""}` :
    value === "__nuevo__" ? "Agregar al catálogo" : "Sin vincular";
  const filtradas = useMemo(() => {
    const q = normalizar(consulta.trim());
    return opciones.filter((opcion) => normalizar([opcion.nombre, opcion.marca, opcion.modelo].join(" ")).includes(q));
  }, [opciones, consulta]);
  const resultados = [
    { id: "", texto: "Sin vincular" },
    { id: "__nuevo__", texto: "Agregar al catálogo" },
    ...filtradas.map((opcion) => ({ id: opcion.id, texto: `${opcion.nombre}${opcion.modelo ? ` (${opcion.modelo})` : ""}` })),
  ];

  function elegir(idElegido: string) {
    onChange(idElegido);
    setConsulta("");
    setAbierto(false);
  }

  return (
    <div className="relative min-w-0">
      <label htmlFor={`${id}-input`} className="sr-only">{etiqueta}</label>
      <input
        ref={input}
        id={`${id}-input`}
        className="campo min-w-0"
        role="combobox"
        aria-label={etiqueta}
        aria-autocomplete="list"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-activedescendant={abierto ? `${id}-opcion-${activa}` : undefined}
        autoComplete="off"
        placeholder={etiquetaActual}
        value={consulta}
        onFocus={() => { setConsulta(""); setAbierto(true); setActiva(0); }}
        onBlur={() => setTimeout(() => setAbierto(false), 120)}
        onChange={(evento) => { setConsulta(evento.target.value); setAbierto(true); setActiva(0); }}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowDown") { evento.preventDefault(); setActiva((i) => Math.min(i + 1, resultados.length - 1)); }
          else if (evento.key === "ArrowUp") { evento.preventDefault(); setActiva((i) => Math.max(i - 1, 0)); }
          else if (evento.key === "Enter" && abierto) { evento.preventDefault(); elegir(resultados[activa]?.id ?? ""); }
          else if (evento.key === "Escape") { setAbierto(false); setConsulta(""); }
        }}
      />
      {abierto && (
        <ul id={`${id}-lista`} role="listbox" className="panel absolute top-full left-0 z-30 mt-1 max-h-60 w-full min-w-48 overflow-auto py-1 shadow-lg">
          {resultados.map((resultado, indice) => (
            <li id={`${id}-opcion-${indice}`} key={resultado.id || "sin-vincular"} role="option" aria-selected={indice === activa}
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => elegir(resultado.id)}
              className={`cursor-pointer px-3 py-2 text-sm ${indice === activa ? "bg-fondo" : ""}`}>
              {resultado.texto}
            </li>
          ))}
          {filtradas.length === 0 && <li className="px-3 py-2 text-sm text-suave">No hay equipos que coincidan.</li>}
        </ul>
      )}
    </div>
  );
}
