"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { DialogoConfirmar } from "@/components/DialogoConfirmar";

export function BotonSalir() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-linea px-3 py-2.5 text-sm font-medium text-tinta transition-colors hover:bg-fondo" aria-haspopup="dialog" onClick={() => setAbierto(true)}>
        <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>
        Cerrar sesión
      </button>
      <DialogoConfirmar
        abierto={abierto}
        titulo="¿Cerrar sesión?"
        descripcion="Tendrás que volver a escribir tu correo y contraseña para entrar."
        textoConfirmar="Cerrar sesión"
        textoProcesando="Cerrando sesión…"
        procesando={saliendo}
        onConfirmar={salir}
        onCancelar={() => setAbierto(false)}
      />
    </>
  );
}
