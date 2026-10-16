import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="panel max-w-xl p-6">
      <h1 className="text-lg font-semibold">No se encontró el presupuesto</h1>
      <p className="ayuda mt-1">Puede que se haya eliminado o que no tengas acceso a él.</p>
      <Link href="/presupuestos" className="btn-secundario mt-4">Ir a presupuestos</Link>
    </div>
  );
}
