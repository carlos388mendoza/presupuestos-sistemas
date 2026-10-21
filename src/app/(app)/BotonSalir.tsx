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
      <button type="button" className="btn-texto px-0" aria-haspopup="dialog" onClick={() => setAbierto(true)}>
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
