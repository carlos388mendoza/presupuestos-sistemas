import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { requerirUsuario } from "@/lib/sesion";
import { contarPendientes } from "@/lib/catalogo";
import { NOMBRES_ROL, puedeManejarUsuarios } from "@/lib/datos";
import { BotonSalir } from "./BotonSalir";
import { EnlaceNav } from "./EnlaceNav";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await requerirUsuario();
  const pendientes = await contarPendientes(db);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="border-b border-linea bg-papel md:sticky md:top-0 md:h-screen md:border-r md:border-b-0">
        <div className="flex h-full flex-col gap-6 p-4 md:p-5">
          <Link href="/presupuestos" className="flex items-center gap-3">
            <Image
              src="/logo-grupo-comidas-circulo-96.png"
              alt="Grupo Comidas"
              width={96}
              height={96}
              className="size-10 shrink-0"
            />
            <div className="min-w-0">
              <div className="font-semibold leading-tight">Presupuestos</div>
              <div className="text-sm text-suave">Departamento de Sistemas</div>
            </div>
          </Link>
          <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Principal">
            <EnlaceNav href="/presupuestos">Presupuestos</EnlaceNav>
            <EnlaceNav href="/catalogo">
              Catálogo de equipos
              {pendientes > 0 && (
                <span className="ml-auto rounded bg-aviso-claro px-1.5 text-xs font-semibold text-aviso" title="Equipos por revisar">
                  {pendientes}
                </span>
              )}
            </EnlaceNav>
            {puedeManejarUsuarios(usuario) && <EnlaceNav href="/admin/usuarios">Usuarios</EnlaceNav>}
          </nav>
          <div className="mt-auto hidden border-t border-linea-2 pt-4 md:block">
            <div className="truncate text-sm font-medium">{usuario.name}</div>
            <div className="mb-2 truncate text-xs text-suave">
              {NOMBRES_ROL[usuario.role]}
            </div>
            <BotonSalir />
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
        <div className="mt-10 border-t border-linea pt-4 md:hidden">
          <span className="text-sm text-suave">{usuario.name} · </span>
          <BotonSalir />
        </div>
      </main>
    </div>
  );
}
