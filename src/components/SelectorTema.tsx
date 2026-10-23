"use client";

import { useEffect, useState } from "react";
import { aplicarTema, obtenerTema, type ModoTema } from "@/lib/tema";

export function SelectorTema() {
  const [tema, setTema] = useState<ModoTema>("automatico");

  useEffect(() => {
    setTema(obtenerTema());
  }, []);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="shrink-0 text-suave">Tema</span>
      <select
        value={tema}
        onChange={(evento) => {
          const modo = evento.target.value as ModoTema;
          setTema(modo);
          aplicarTema(modo);
        }}
        className="campo w-auto"
        aria-label="Cambiar tema de la aplicación"
      >
        <option value="claro">Claro</option>
        <option value="oscuro">Oscuro</option>
        <option value="automatico">Sistema</option>
      </select>
    </label>
  );
}
