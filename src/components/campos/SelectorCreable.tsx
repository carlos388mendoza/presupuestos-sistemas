"use client";

import { useId, useMemo, useRef, useState } from "react";

type Props = {
  /** Nombre del campo oculto que se envía con el formulario (valores separados por salto de línea). */
  name: string;
  etiqueta: string;
  /** Opciones sugeridas para elegir. */
  sugeridas: string[];
  /** Selección inicial. */
  defaultSeleccion?: string[];
  ayuda?: string;
  placeholder?: string;
  maximo?: number;
  maxLength?: number;
};

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/**
 * Combobox de selección múltiple que permite agregar valores nuevos (patrón "creatable").
 * Teclado: flechas para moverse, Enter para elegir o agregar lo escrito, Escape para cerrar,
 * Retroceso con el campo vacío para quitar la última.
 */
export function SelectorCreable({
  name,
  etiqueta,
  sugeridas,
  defaultSeleccion = [],
  ayuda,
  placeholder = "Escribe o elige…",
  maximo = 30,
  maxLength = 120,
}: Props) {
  const id = useId();
  const idLista = `${id}-lista`;
  const idAyuda = `${id}-ayuda`;
  const input = useRef<HTMLInputElement>(null);
  const [seleccion, setSeleccion] = useState<string[]>(defaultSeleccion);
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const [anuncio, setAnuncio] = useState("");

  const elegidas = useMemo(() => new Set(seleccion.map(normalizar)), [seleccion]);
  const buscado = normalizar(texto);

  // Sugeridas no elegidas que coinciden con lo escrito, y "Agregar …" si lo escrito es nuevo.
  const opciones = useMemo(() => {
    const lista: { valor: string; nueva: boolean }[] = sugeridas
      .filter((s) => !elegidas.has(normalizar(s)) && normalizar(s).includes(buscado))
      .map((valor) => ({ valor, nueva: false }));
    const limpio = texto.trim().slice(0, maxLength);
    if (limpio && !elegidas.has(buscado) && !sugeridas.some((s) => normalizar(s) === buscado)) {
      lista.push({ valor: limpio, nueva: true });
    }
    return lista;
  }, [sugeridas, elegidas, buscado, texto, maxLength]);

  const lleno = seleccion.length >= maximo;
  const mostrarLista = abierto && !lleno && opciones.length > 0;

  function agregar(valor: string) {
    const limpio = valor.trim().slice(0, maxLength);
    if (!limpio || elegidas.has(normalizar(limpio)) || lleno) return;
    setSeleccion((s) => [...s, limpio]);
    setTexto("");
    setActiva(-1);
    setAnuncio(`${limpio} agregada.`);
  }

  function quitar(valor: string) {
    setSeleccion((s) => s.filter((x) => x !== valor));
    setAnuncio(`${valor} quitada.`);
    input.current?.focus();
  }

  function alPresionar(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setAbierto(true);
        setActiva((i) => (opciones.length ? (i + 1) % opciones.length : -1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setAbierto(true);
        setActiva((i) => (opciones.length ? (i <= 0 ? opciones.length - 1 : i - 1) : -1));
        break;
      case "Enter": {
        const opcion = mostrarLista && activa >= 0 ? opciones[activa] : null;
        if (opcion) {
          e.preventDefault();
          agregar(opcion.valor);
        } else if (texto.trim()) {
          e.preventDefault();
          agregar(texto);
        }
        // Con el campo vacío y sin opción activa, Enter envía el formulario.
        break;
      }
      case "Escape":
        if (abierto) {
          e.preventDefault();
          setAbierto(false);
          setActiva(-1);
        }
        break;
      case "Backspace":
        if (!texto && seleccion.length) quitar(seleccion[seleccion.length - 1]);
        break;
    }
  }

  return (
    <div>
      <label htmlFor={`${id}-input`} className="etiqueta">{etiqueta}</label>
      <input type="hidden" name={name} value={seleccion.join("\n")} />
      <div
        className="campo flex min-h-10 flex-wrap items-center gap-1.5 py-1.5 focus-within:border-tinta"
        onClick={() => input.current?.focus()}
      >
        {seleccion.length > 0 && (
          <ul className="contents" aria-label={`${etiqueta} elegidas`}>
            {seleccion.map((s) => (
              <li key={s} className="flex items-center gap-1 rounded bg-fondo py-0.5 pr-0.5 pl-2 text-sm">
                {s}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    quitar(s);
                  }}
                  aria-label={`Quitar ${s}`}
                  className="flex size-6 items-center justify-center rounded text-suave hover:bg-linea hover:text-tinta"
                >
                  <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="relative min-w-40 flex-1">
          <input
            ref={input}
            id={`${id}-input`}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={mostrarLista}
            aria-controls={idLista}
            aria-activedescendant={mostrarLista && activa >= 0 ? `${id}-op-${activa}` : undefined}
            aria-describedby={ayuda ? idAyuda : undefined}
            autoComplete="off"
            maxLength={maxLength}
            disabled={lleno}
            placeholder={lleno ? `Máximo ${maximo}` : placeholder}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setAbierto(true);
              setActiva(-1);
            }}
            onFocus={() => setAbierto(true)}
            onBlur={() => {
              setAbierto(false);
              setActiva(-1);
            }}
            onKeyDown={alPresionar}
            className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-suave/70"
          />
          <ul
            id={idLista}
            role="listbox"
            aria-label={etiqueta}
            hidden={!mostrarLista}
            className="panel absolute top-full left-0 z-20 mt-2 max-h-60 w-full min-w-56 overflow-auto py-1 shadow-lg"
          >
            {opciones.map((o, i) => (
              <li
                key={`${o.nueva ? "nueva" : "s"}-${o.valor}`}
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={i === activa}
                // mousedown evita que el campo pierda el foco antes de elegir
                onMouseDown={(e) => {
                  e.preventDefault();
                  agregar(o.valor);
                }}
                onMouseMove={() => setActiva(i)}
                className={`cursor-pointer px-3 py-2 text-sm ${i === activa ? "bg-fondo" : ""}`}
              >
                {o.nueva ? (
                  <>
                    Agregar <strong className="font-semibold">“{o.valor}”</strong>
                  </>
                ) : (
                  o.valor
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {ayuda && (
        <p id={idAyuda} className="ayuda mt-1.5">
          {ayuda}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>
    </div>
  );
}
