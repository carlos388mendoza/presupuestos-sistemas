"use client";

import { useActionState, useEffect, useRef } from "react";
import type { EstadoAccion } from "@/lib/tipos";

type Props = {
  action: (prev: EstadoAccion, fd: FormData) => Promise<EstadoAccion>;
  children: React.ReactNode;
  className?: string;
  /** Si se indica, pide confirmación antes de enviar. */
  confirmar?: string;
  /** Limpia el formulario cuando la acción termina bien. */
  limpiarAlTerminar?: boolean;
  /** Muestra los mensajes en línea (para botones dentro de filas). */
  enLinea?: boolean;
};

/** Formulario que ejecuta una server action y muestra su error o confirmación. */
export function FormAccion({ action, children, className, confirmar, limpiarAlTerminar, enLinea }: Props) {
  const [estado, accion, pendiente] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.ok && limpiarAlTerminar) ref.current?.reset();
  }, [estado, limpiarAlTerminar]);

  return (
    <form
      ref={ref}
      action={accion}
      className={className}
      aria-busy={pendiente}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      {/* `contents`: el fieldset solo desactiva los campos mientras se envía; el diseño
          (flex, grid, gap, clase `formulario`) del <form> se aplica directo a los campos. */}
      <fieldset disabled={pendiente} className="contents">
        {children}
      </fieldset>
      {estado?.error && (
        <p role="alert" className={`text-sm text-peligro ${enLinea ? "ml-2" : "mt-2"}`}>
          {estado.error}
        </p>
      )}
      {estado?.ok && !enLinea && (
        <p role="status" className="mt-2 text-sm text-usd">
          {estado.ok}
        </p>
      )}
    </form>
  );
}
