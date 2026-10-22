"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NOMBRES_ROL } from "@/lib/datos";
import { BotonSalir } from "./BotonSalir";

type Rol = keyof typeof NOMBRES_ROL;
function Icono({ tipo, className = "size-5" }: { tipo: "home" | "box" | "users" | "plus" | "menu" | "close"; className?: string }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  };
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[tipo]}</svg>;
}

export function NavegacionApp({ children, usuario, pendientes, puedeCrear, puedeUsuarios }: {
  children: React.ReactNode; usuario: { name: string; role: Rol }; pendientes: number; puedeCrear: boolean; puedeUsuarios: boolean;
}) {
  const ruta = usePathname();
  const [menuMovil, setMenuMovil] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [colapsada, setColapsada] = useState(false);
  const inicio = ruta === "/presupuestos";
  const enlaces = [
    { href: "/presupuestos", texto: "Presupuestos", icono: "home" as const },
    { href: "/catalogo", texto: "Catálogo de equipos", icono: "box" as const, badge: pendientes },
    ...(puedeUsuarios ? [{ href: "/admin/usuarios", texto: "Usuarios", icono: "users" as const }] : []),
  ];
  return <div className={`min-h-screen md:grid ${colapsada ? "md:grid-cols-[5rem_minmax(0,1fr)]" : "md:grid-cols-[15rem_minmax(0,1fr)]"}`}>
    <aside className="hidden border-r border-linea bg-papel md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-6 md:p-4">
      <div className={`flex items-center ${colapsada ? "justify-center" : "justify-between"}`}>
        <Link href="/presupuestos" className="flex min-w-0 items-center gap-3">
          <Image src="/logo-grupo-comidas-circulo-96.png" alt="Grupo Comidas" width={96} height={96} className="size-10 shrink-0" />
          {!colapsada && <span className="min-w-0"><span className="block font-semibold">Presupuestos</span><span className="block text-sm text-suave">Departamento de Sistemas</span></span>}
        </Link>
        {!colapsada && <button type="button" aria-label="Contraer menú" onClick={() => setColapsada(true)} className="rounded-md p-2 text-suave hover:bg-fondo"><Icono tipo="menu"/></button>}
        {colapsada && <button type="button" aria-label="Expandir menú" onClick={() => setColapsada(false)} className="rounded-md p-2 text-suave hover:bg-fondo"><Icono tipo="menu"/></button>}
      </div>
      <nav aria-label="Principal" className="flex flex-col gap-1">
        {enlaces.map((e) => <Link key={e.href} href={e.href} title={colapsada ? e.texto : undefined} aria-current={ruta === e.href ? "page" : undefined} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${ruta === e.href ? "bg-tinta text-white" : "text-tinta hover:bg-fondo"}`}>
          <Icono tipo={e.icono}/>{!colapsada && <span className="flex-1">{e.texto}</span>}{!colapsada && !!e.badge && <span className="rounded bg-aviso-claro px-1.5 text-xs text-aviso">{e.badge}</span>}
        </Link>)}
      </nav>
      <div className={`mt-auto border-t border-linea-2 pt-4 ${colapsada ? "text-center" : ""}`}>
        {!colapsada && <><div className="truncate text-sm font-medium">{usuario.name}</div><div className="mb-2 text-xs text-suave">{NOMBRES_ROL[usuario.role]}</div></>}
        <BotonSalir/>
      </div>
    </aside>
    <main className="min-w-0 px-4 pb-24 pt-4 md:px-10 md:py-8">
      <div className="mb-3 flex items-center justify-between md:hidden">
        <Link href="/presupuestos" className="flex items-center gap-2"><Image src="/logo-grupo-comidas-circulo-96.png" alt="Grupo Comidas" width={96} height={96} className="size-8"/><span className="font-semibold">Presupuestos</span></Link>
        <button type="button" aria-label={menuMovil ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuMovil} onClick={() => setMenuMovil(!menuMovil)} className="rounded-md border border-linea bg-papel p-2"><Icono tipo={menuMovil ? "close" : "menu"}/></button>
      </div>
      {menuMovil && <nav aria-label="Menú móvil" className="panel mb-4 flex flex-col gap-1 p-2 md:hidden">{enlaces.map((e) => <Link key={e.href} href={e.href} onClick={() => setMenuMovil(false)} className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-fondo"><Icono tipo={e.icono}/>{e.texto}{!!e.badge && <span className="ml-auto text-xs text-aviso">{e.badge}</span>}</Link>)}</nav>}
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
    <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-3 border-t border-linea bg-papel/95 px-5 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(29,43,58,0.08)] backdrop-blur md:hidden">
      <Link href="/presupuestos" aria-label="Inicio, presupuestos" className={`flex flex-col items-center justify-center gap-0.5 ${inicio ? "text-tinta" : "text-suave"}`}><Icono tipo="home"/><span className="text-[11px]">Inicio</span></Link>
      <div className="flex items-center justify-center">{puedeCrear ? <Link href="/presupuestos/nuevo" aria-label="Crear presupuesto" className="-mt-5 flex size-14 items-center justify-center rounded-full bg-tinta text-white shadow-lg ring-4 ring-fondo"><Icono tipo="plus" className="size-7"/></Link> : <span aria-hidden className="size-14"/>}</div>
      <div className="relative flex items-center justify-center">
        <button type="button" aria-label="Menú de usuario" aria-expanded={menuUsuario} onClick={() => setMenuUsuario(!menuUsuario)} className="flex flex-col items-center justify-center gap-0.5 text-suave"><Icono tipo="users"/><span className="text-[11px]">Cuenta</span></button>
        {menuUsuario && <div className="panel absolute right-1 bottom-[calc(100%+0.6rem)] min-w-52 p-2 shadow-xl">
          <div className="border-b border-linea-2 px-3 py-2"><div className="truncate text-sm font-medium">{usuario.name}</div><div className="text-xs text-suave">{NOMBRES_ROL[usuario.role]}</div></div>
          {puedeUsuarios && <Link href="/admin/usuarios" onClick={() => setMenuUsuario(false)} className="flex items-center gap-2 rounded px-3 py-2.5 text-sm hover:bg-fondo"><Icono tipo="users" className="size-4"/>Usuarios y cuentas</Link>}
          <div className="px-3 py-2"><BotonSalir/></div>
        </div>}
      </div>
    </nav>
  </div>;
}
