"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { CampoContrasena, CampoTexto } from "@/components/campos";

export function FormLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    if (error) {
      setCargando(false);
      setError(
        error.status === 403
          ? (error.message ?? "Este usuario está desactivado.")
          : "Correo o contraseña incorrectos.",
      );
      return;
    }
    router.replace("/presupuestos");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="panel space-y-4 p-6">
      <CampoTexto id="email" name="email" type="email" etiqueta="Correo" autoComplete="email" required />
      <CampoContrasena id="password" name="password" etiqueta="Contraseña" autoComplete="current-password" required />
      {error && <p role="alert" className="text-sm text-peligro">{error}</p>}
      <button type="submit" disabled={cargando} className="btn-primario w-full">
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
