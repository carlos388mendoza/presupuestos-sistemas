"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function ModalFormulario({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const idTitulo = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const botonAbrir = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    if (abierto && !elemento.open) {
      elemento.showModal();
      elemento.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea")?.focus();
    } else if (!abierto && elemento.open) {
      elemento.close();
      botonAbrir.current?.focus();
    }
  }, [abierto]);

  return (
    <>
      <button ref={botonAbrir} type="button" className="btn-primario w-full" onClick={() => setAbierto(true)}>
        {titulo}
      </button>
      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        onCancel={(evento) => {
          evento.preventDefault();
          setAbierto(false);
        }}
        onClick={(evento) => {
          if (evento.target === dialogo.current) setAbierto(false);
        }}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-lg border border-linea bg-papel p-0 text-tinta shadow-xl backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between gap-4 border-b border-linea-2 px-5 py-4">
          <h2 id={idTitulo} className="text-lg font-semibold">{titulo}</h2>
          <button type="button" className="btn-texto shrink-0" onClick={() => setAbierto(false)} aria-label="Cerrar ventana">
            Cerrar
          </button>
        </div>
        <div className="p-5">{children}</div>
      </dialog>
    </>
  );
}
