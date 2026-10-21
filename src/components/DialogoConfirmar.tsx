"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type Props = {
  abierto: boolean;
  titulo: string;
  descripcion?: ReactNode;
  textoConfirmar: string;
  textoCancelar?: string;
  /** Mientras es true, los botones se desactivan y el de confirmar muestra `textoProcesando`. */
  procesando?: boolean;
  textoProcesando?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

/**
 * Diálogo de confirmación accesible (reemplaza a window.confirm).
 * Usa <dialog> modal: atrapa el foco, se cierra con Escape y devuelve el foco
 * al elemento que lo abrió. El foco inicial va a "Cancelar" (la opción segura).
 */
export function DialogoConfirmar({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  textoCancelar = "Cancelar",
  procesando = false,
  textoProcesando,
  onConfirmar,
  onCancelar,
}: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const anterior = useRef<HTMLElement | null>(null);
  const idTitulo = useId();
  const idDescripcion = useId();

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) {
      anterior.current = document.activeElement as HTMLElement | null;
      d.showModal();
      cancelar.current?.focus();
    } else if (!abierto && d.open) {
      d.close();
      anterior.current?.focus();
    }
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      role="alertdialog"
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!procesando) onCancelar();
      }}
      onClick={(e) => {
        if (e.target === dialogo.current && !procesando) onCancelar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border border-linea bg-papel p-0 text-tinta shadow-xl backdrop:bg-black/40"
    >
      <div className="p-5">
        <h2 id={idTitulo} className="text-lg font-semibold">{titulo}</h2>
        {descripcion && (
          <p id={idDescripcion} className="ayuda mt-2">
            {descripcion}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelar} type="button" className="btn-secundario" onClick={onCancelar} disabled={procesando}>
            {textoCancelar}
          </button>
          <button type="button" className="btn-primario" onClick={onConfirmar} disabled={procesando}>
            {procesando && textoProcesando ? textoProcesando : textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}
