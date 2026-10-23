"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buscarGlobalAction } from "@/actions/busqueda";
import type { ResultadoBusquedaGlobal } from "@/lib/datos";

type Props = { abierto: boolean; onCerrar: () => void };

export function BusquedaGlobal({ abierto, onCerrar }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusquedaGlobal | null>(null);
  const [cargando, setCargando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (abierto) {
      setConsulta("");
      setResultados(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      setCargando(true);
      try {
        const r = await buscarGlobalAction(consulta);
        setResultados(r);
      } finally {
        setCargando(false);
      }
    }, 250);
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [consulta, abierto]);

  useEffect(() => {
    if (!abierto) return;
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCerrar();
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const hayResultados =
    resultados &&
    (resultados.presupuestos.length || resultados.equipos.length || resultados.usuarios.length);

  function ir(ruta: string) {
    onCerrar();
    router.push(ruta);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 p-4 pt-[12vh]">
      <div role="dialog" aria-modal="true" aria-label="Búsqueda global" className="panel w-full max-w-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-linea-2 px-4 py-3">
          <input
            ref={inputRef}
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Buscar presupuestos, equipos, usuarios…"
            aria-label="Buscar en todo"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-suave"
          />
          {cargando && <span className="text-xs text-suave">Buscando…</span>}
          <button type="button" className="btn-texto px-0 text-xs" onClick={onCerrar}>Esc</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!resultados && <p className="p-4 text-sm text-suave">Escribe para buscar.</p>}
          {resultados && !hayResultados && <p className="p-4 text-sm text-suave">Sin resultados.</p>}
          {resultados?.presupuestos.length ? (
            <section className="mb-2">
              <h3 className="px-3 py-2 text-[11px] font-semibold tracking-wide text-suave">Presupuestos</h3>
              <ul>
                {resultados.presupuestos.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => ir(`/presupuestos/${p.id}`)} className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-fondo">
                      <span className="min-w-0"><span className="block truncate font-medium">{p.nombre}</span><span className="block truncate text-xs text-suave">{p.restaurante} · {p.autor}</span></span>
                      <span className="shrink-0 text-xs text-suave">{p.estado === "listo" ? "Listo" : "Borrador"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {resultados?.equipos.length ? (
            <section className="mb-2">
              <h3 className="px-3 py-2 text-[11px] font-semibold tracking-wide text-suave">Equipos</h3>
              <ul>
                {resultados.equipos.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => ir(`/catalogo?q=${encodeURIComponent(e.nombre)}`)} className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-fondo">
                      <span className="min-w-0"><span className="block truncate font-medium">{e.nombre}</span><span className="block truncate text-xs text-suave">{[e.marca, e.modelo, e.categoria].filter(Boolean).join(" · ")}</span></span>
                      {!e.revisado && <span className="shrink-0 rounded bg-aviso-claro px-2 py-0.5 text-xs">Por revisar</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {resultados?.usuarios.length ? (
            <section className="mb-2">
              <h3 className="px-3 py-2 text-[11px] font-semibold tracking-wide text-suave">Usuarios</h3>
              <ul>
                {resultados.usuarios.map((u) => (
                  <li key={u.id}>
                    <button type="button" onClick={() => ir("/admin/usuarios")} className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-fondo">
                      <span className="min-w-0"><span className="block truncate font-medium">{u.name}</span><span className="block truncate text-xs text-suave">{u.email}</span></span>
                      <span className="shrink-0 text-xs text-suave">{u.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <div className="border-t border-linea-2 px-4 py-2 text-xs text-suave">
          Atajos: Ctrl/Cmd+K buscar · Ctrl/Cmd+N nuevo presupuesto · Ctrl/Cmd+/ ayuda · Esc cerrar
        </div>
      </div>
    </div>
  );
}