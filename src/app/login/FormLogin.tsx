"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function FormLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);

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
      <div>
        <label htmlFor="email" className="etiqueta">Correo</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="campo" />
      </div>
      <div>
        <label htmlFor="password" className="etiqueta">Contraseña</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={verContrasena ? "text" : "password"}
            autoComplete="current-password"
            required
            className="campo pr-11"
          />
          <button
            type="button"
            onClick={() => setVerContrasena((v) => !v)}
            aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={verContrasena}
            aria-controls="password"
            title={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-suave hover:text-tinta"
          >
            {verContrasena ? <IconoOjoTachado /> : <IconoOjo />}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-peligro">{error}</p>}
      <button type="submit" disabled={cargando} className="btn-primario w-full">
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
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
