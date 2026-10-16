"use client";

export default function ErrorApp({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="panel max-w-xl p-6">
      <h1 className="text-lg font-semibold">No se pudo cargar esta página</h1>
      <p className="ayuda mt-1">{error.message || "Ocurrió un error inesperado."}</p>
      <button className="btn-secundario mt-4" onClick={reset}>Intentar de nuevo</button>
    </div>
  );
}
