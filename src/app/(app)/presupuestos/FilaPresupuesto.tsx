"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

export function FilaPresupuesto({ href, nombre, children }: { href: string; nombre: string; children: ReactNode }) {
  const router = useRouter();

  function abrir() {
    router.push(href);
  }

  function alHacerClic(evento: MouseEvent<HTMLTableRowElement>) {
    if (evento.target instanceof Element && evento.target.closest("a, button, input, select, textarea")) return;
    abrir();
  }

  function alPresionarTecla(evento: KeyboardEvent<HTMLTableRowElement>) {
    if (evento.target !== evento.currentTarget || evento.key !== "Enter") return;
    evento.preventDefault();
    abrir();
  }

  return (
    <tr
      tabIndex={0}
      aria-label={`Abrir presupuesto ${nombre}`}
      aria-keyshortcuts="Enter"
      onClick={alHacerClic}
      onKeyDown={alPresionarTecla}
      className="cursor-pointer border-b border-linea-2 last:border-0 hover:bg-fondo/60 focus-visible:bg-fondo/60"
    >
      {children}
    </tr>
  );
}
