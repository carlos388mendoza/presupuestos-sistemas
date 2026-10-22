"use client";

import { useId, useMemo, useState } from "react";

const GRUPOS = [
  { nombre: "Marcas de Grupo Comidas", opciones: ["KFC", "Pizza Hut", "Denny's", "China Wok"] },
];

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function ComboboxRestaurante({ defaultValue = "", maxLength = 200 }: { defaultValue?: string; maxLength?: number }) {
  const id = useId();
  const idLista = `${id}-opciones`;
  const [valor, setValor] = useState(defaultValue);
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);

  const grupos = useMemo(() => {
    const busqueda = normalizar(valor);
    const sugerencias = GRUPOS.map((grupo) => ({
      ...grupo,
      opciones: grupo.opciones.filter((opcion) => normalizar(opcion).includes(busqueda)),
    })).filter((grupo) => grupo.opciones.length > 0);
    const personalizado = valor.trim();
    if (personalizado && !GRUPOS.some((grupo) => grupo.opciones.some((opcion) => normalizar(opcion) === busqueda))) {
      sugerencias.push({ nombre: "Usar otro nombre", opciones: [personalizado] });
    }
    return sugerencias;
  }, [valor]);

  const opciones = grupos.flatMap((grupo) => grupo.opciones);
  const idActiva = abierto && activa >= 0 && activa < opciones.length ? `${id}-opcion-${activa}` : undefined;

  function seleccionar(opcion: string) {
    setValor(opcion);
    setAbierto(false);
    setActiva(-1);
  }

  function alPresionar(tecla: React.KeyboardEvent<HTMLInputElement>) {
    if (tecla.key === "ArrowDown") {
      tecla.preventDefault();
      setAbierto(true);
      setActiva((indice) => opciones.length ? (indice + 1) % opciones.length : -1);
    } else if (tecla.key === "ArrowUp") {
      tecla.preventDefault();
      setAbierto(true);
      setActiva((indice) => opciones.length ? (indice <= 0 ? opciones.length - 1 : indice - 1) : -1);
    } else if (tecla.key === "Enter" && abierto && opciones.length) {
      tecla.preventDefault();
      seleccionar(opciones[activa >= 0 ? activa : 0]);
    } else if (tecla.key === "Escape") {
      setAbierto(false);
      setActiva(-1);
    }
  }

  let indiceOpcion = 0;

  return (
    <div className="relative">
      <label htmlFor={`${id}-entrada`} className="etiqueta">Restaurante</label>
      <div className="relative">
        <input
          id={`${id}-entrada`}
          name="restaurante"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={abierto && opciones.length > 0}
          aria-controls={idLista}
          aria-activedescendant={idActiva}
          autoComplete="off"
          className="campo pr-10"
          maxLength={maxLength}
          placeholder="Busca o escribe una sucursal"
          required
          value={valor}
          onChange={(evento) => {
            setValor(evento.target.value);
            setAbierto(true);
            setActiva(-1);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => window.setTimeout(() => setAbierto(false), 100)}
          onKeyDown={alPresionar}
        />
        <button
          type="button"
          aria-label={abierto ? "Ocultar restaurantes sugeridos" : "Mostrar restaurantes sugeridos"}
          aria-expanded={abierto}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-suave hover:text-tinta"
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={() => setAbierto((actual) => !actual)}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={`size-4 transition-transform ${abierto ? "rotate-180" : ""}`}>
            <path fillRule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      {abierto && opciones.length > 0 && (
        <div id={idLista} role="listbox" aria-label="Restaurantes sugeridos" className="panel absolute z-20 mt-1 max-h-64 w-full overflow-y-auto p-1 shadow-lg">
          {grupos.map((grupo) => (
            <div key={grupo.nombre} role="group" aria-label={grupo.nombre}>
              <div className="px-3 pb-1 pt-2 text-xs font-semibold text-suave">{grupo.nombre}</div>
              {grupo.opciones.map((opcion) => {
                const indice = indiceOpcion++;
                return (
                  <div
                    key={`${grupo.nombre}-${opcion}`}
                    id={`${id}-opcion-${indice}`}
                    role="option"
                    aria-selected={indice === activa || opcion === valor}
                    className={`cursor-pointer rounded px-3 py-2 text-sm ${indice === activa ? "bg-fondo text-tinta" : "hover:bg-fondo/70"}`}
                    onMouseDown={(evento) => evento.preventDefault()}
                    onClick={() => seleccionar(opcion)}
                  >
                    {grupo.nombre === "Usar otro nombre" ? `Usar “${opcion}”` : opcion}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
