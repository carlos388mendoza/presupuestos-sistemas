"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function FiltrosCatalogo({
  busquedaInicial,
  soloPendientesInicial,
  totalPendientes,
}: {
  busquedaInicial: string;
  soloPendientesInicial: boolean;
  totalPendientes: number;
}) {
  const router = useRouter();
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [soloPendientes, setSoloPendientes] = useState(soloPendientesInicial);

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  function aplicarFiltros(q: string, pendientes: boolean) {
    if (temporizador.current) clearTimeout(temporizador.current);
    const parametros = new URLSearchParams();
    if (q.trim()) parametros.set("q", q.trim());
    if (pendientes) parametros.set("pendientes", "1");
    const consulta = parametros.toString();
    router.replace(`/catalogo${consulta ? `?${consulta}` : ""}`, { scroll: false });
  }

  function programarBusqueda(q: string) {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => aplicarFiltros(q, soloPendientes), 300);
  }

  return (
    <form
      className="mb-4 flex flex-wrap items-center gap-3"
      role="search"
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicarFiltros(busqueda, soloPendientes);
      }}
    >
      <label htmlFor="q" className="sr-only">Buscar</label>
      <input
        ref={inputRef}
        id="q"
        name="q"
        value={busqueda}
        onChange={(evento) => {
          const nuevaBusqueda = evento.target.value;
          setBusqueda(nuevaBusqueda);
          programarBusqueda(nuevaBusqueda);
        }}
        placeholder="Buscar por nombre, marca, modelo o categoría"
        className="campo max-w-sm"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="pendientes"
          value="1"
          checked={soloPendientes}
          onChange={(evento) => {
            const activado = evento.target.checked;
            setSoloPendientes(activado);
            aplicarFiltros(busqueda, activado);
          }}
        />
        Solo por revisar ({totalPendientes})
      </label>
      <button type="submit" className="sr-only">Buscar equipos</button>
      {(busqueda || soloPendientes) && <button type="button" className="btn-texto" onClick={() => {
        if (temporizador.current) clearTimeout(temporizador.current);
        setBusqueda("");
        setSoloPendientes(false);
        router.replace("/catalogo", { scroll: false });
      }}>Limpiar</button>}
    </form>
  );
}
