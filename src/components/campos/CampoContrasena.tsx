"use client";

import { useState } from "react";
import { Campo, type CampoTextoProps } from "./Campos";

/** Campo de contraseña con botón de ojo para mostrarla u ocultarla. */
export function CampoContrasena({
  etiqueta,
  opcional,
  ayuda,
  classNameContenedor,
  className,
  id,
  ...props
}: Omit<CampoTextoProps, "type">) {
  const [visible, setVisible] = useState(false);
  const idCampo = id ?? props.name;
  const texto = visible ? "Ocultar contraseña" : "Mostrar contraseña";
  return (
    <Campo id={idCampo} etiqueta={etiqueta} opcional={opcional} ayuda={ayuda} classNameContenedor={classNameContenedor}>
      <div className="relative">
        <input
          id={idCampo}
          type={visible ? "text" : "password"}
          aria-describedby={ayuda && idCampo ? `${idCampo}-ayuda` : undefined}
          className={["campo pr-11", className].filter(Boolean).join(" ")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={texto}
          aria-pressed={visible}
          aria-controls={idCampo}
          title={texto}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-suave hover:text-tinta"
        >
          {visible ? <IconoOjoTachado /> : <IconoOjo />}
        </button>
      </div>
    </Campo>
  );
}

function IconoOjo() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoOjoTachado() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.7 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.2" />
      <path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
