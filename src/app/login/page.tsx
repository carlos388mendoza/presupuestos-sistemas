import Image from "next/image";
import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/sesion";
import { FormLogin } from "./FormLogin";

export default async function PaginaLogin() {
  if (await obtenerUsuario()) redirect("/presupuestos");
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Image
            src="/logo-grupo-comidas-circulo-192.png"
            alt="Grupo Comidas"
            width={192}
            height={192}
            preload
            className="mb-4 size-20"
          />
          <h1 className="text-2xl font-semibold tracking-tight">Presupuestos de Sistemas</h1>
          <p className="ayuda mt-1">Aperturas y remodelaciones de restaurantes.</p>
        </div>
        <FormLogin />
        <p className="ayuda mt-6">¿No tienes acceso? Pídelo a un administrador.</p>
      </div>
    </main>
  );
}
