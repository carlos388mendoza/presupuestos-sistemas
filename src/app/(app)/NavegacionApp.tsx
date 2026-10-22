"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NOMBRES_ROL } from "@/lib/datos";
import { BotonSalir } from "./BotonSalir";

type Rol = keyof typeof NOMBRES_ROL;
function Icono({ tipo, className = "size-5" }: { tipo: "home" | "box" | "users" | "plus" | "menu" | "close" | "chevron" | "right" | "search"; className?: string }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    right: <path d="m9 18 6-6-6-6"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  };
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[tipo]}</svg>;
}

export function NavegacionApp({ children, usuario, pendientes, puedeCrear, puedeUsuarios }: {
  children: React.ReactNode; usuario: { name: string; role: Rol }; pendientes: number; puedeCrear: boolean; puedeUsuarios: boolean;
}) {
  const ruta = usePathname();
  const [menuMovil, setMenuMovil] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [buscar, setBuscar] = useState(false);
  const inicio = ruta === "/presupuestos";
  const enlaces = [
    { href: "/presupuestos", texto: "Presupuestos", icono: "home" as const },
    { href: "/catalogo", texto: "Catálogo de equipos", icono: "box" as const, badge: pendientes },
    ...(puedeUsuarios ? [{ href: "/admin/usuarios", texto: "Usuarios", icono: "users" as const }] : []),
  ];
  return <div className="min-h-screen">
    <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-linea bg-papel px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button type="button" aria-label={menuMovil ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuMovil} onClick={() => setMenuMovil(!menuMovil)} className="shrink-0 rounded-md p-2 text-tinta hover:bg-fondo"><Icono tipo={menuMovil ? "close" : "menu"}/></button>
        <Link href="/presupuestos" className="flex min-w-0 items-center gap-2"><Image src="/logo-grupo-comidas-circulo-96.png" alt="Grupo Comidas" width={96} height={96} className="size-9 shrink-0"/><span className="truncate font-semibold">Presupuestos</span></Link>
      </div>
      <div className="flex items-center gap-2">
        {buscar && <form action="/presupuestos" className="flex items-center">
          <input autoFocus name="buscar" placeholder="Buscar en presupuestos…" aria-label="Buscar en presupuestos" className="w-[min(55vw,24rem)] rounded-lg border border-linea bg-papel px-3 py-2 text-sm outline-none focus:border-tinta"/>
          <button className="sr-only">Buscar</button>
        </form>}
        <button type="button" aria-label={buscar ? "Cerrar búsqueda" : "Buscar presupuestos"} onClick={() => setBuscar(!buscar)} className="shrink-0 rounded-md p-2 text-tinta hover:bg-fondo"><Icono tipo={buscar ? "close" : "search"}/></button>
      </div>
    </header>
    <main className="min-w-0 px-4 pb-24 pt-5 sm:px-6 xl:px-8 xl:py-7">
      {menuMovil && <div className="fixed inset-0 z-50">
        <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-black/40" onClick={() => setMenuMovil(false)}/>
        <nav aria-label="Menú móvil" className="absolute inset-y-0 left-0 flex w-[min(88vw,22rem)] flex-col gap-5 overflow-y-auto border-r border-linea bg-fondo p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <Link href="/presupuestos" onClick={() => setMenuMovil(false)} className="flex items-center gap-3"><Image src="/logo-grupo-comidas-circulo-96.png" alt="" width={96} height={96} className="size-10"/><span className="font-semibold">Presupuestos<br/><span className="text-xs font-normal text-suave">Grupo Comidas · Sistemas</span></span></Link>
            <button type="button" aria-label="Cerrar menú" onClick={() => setMenuMovil(false)} className="rounded-md p-2 hover:bg-papel"><Icono tipo="close"/></button>
          </div>
          {puedeCrear && <Link href="/presupuestos/nuevo" onClick={() => setMenuMovil(false)} className="flex items-center justify-center gap-2 rounded-md bg-tinta px-4 py-3 font-semibold text-white"><Icono tipo="plus"/>Nuevo presupuesto</Link>}
          <div className="flex flex-col gap-1">{enlaces.map((e) => <Link key={e.href} href={e.href} onClick={() => setMenuMovil(false)} aria-current={ruta === e.href ? "page" : undefined} className={`flex items-center gap-3 rounded-md px-3 py-3 font-medium ${ruta === e.href ? "bg-papel text-tinta shadow-sm" : "text-tinta-2 hover:bg-papel"}`}><Icono tipo={e.icono}/><span className="flex-1">{e.texto}</span>{!!e.badge && <span className="text-xs text-aviso">{e.badge}</span>}</Link>)}</div>
          <div className="mt-auto border-t border-linea pt-4"><div className="mb-1 font-semibold">{usuario.name}</div><div className="mb-3 text-sm text-suave">{NOMBRES_ROL[usuario.role]}</div><BotonSalir/></div>
        </nav>
      </div>}
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
    <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-40 grid h-[4.5rem] grid-cols-4 border-t border-linea bg-papel/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden">
      <Link href="/presupuestos" aria-label="Inicio, presupuestos" className={`flex flex-col items-center justify-center gap-0.5 ${inicio ? "text-[#d6001c]" : "text-suave"}`}><span className={inicio ? "flex size-9 items-center justify-center rounded-full bg-[#fdebed]" : "flex size-9 items-center justify-center"}><Icono tipo="home"/></span><span className="text-[11px]">Inicio</span></Link>
      <div className="flex items-center justify-center">{puedeCrear ? <Link href="/presupuestos/nuevo" aria-label="Nuevo presupuesto" className="-mt-5 flex flex-col items-center justify-center gap-0.5 text-tinta"><span className="flex size-14 items-center justify-center rounded-full bg-tinta text-white shadow-lg ring-4 ring-papel"><Icono tipo="plus" className="size-7"/></span><span className="text-[11px]">Nuevo</span></Link> : <span aria-hidden className="size-14"/>}</div>
      <Link href="/catalogo" aria-label="Catálogo de equipos" className={`flex flex-col items-center justify-center gap-0.5 ${ruta.startsWith("/catalogo") ? "text-[#d6001c]" : "text-suave"}`}><span className={ruta.startsWith("/catalogo") ? "flex size-9 items-center justify-center rounded-full bg-[#fdebed]" : "flex size-9 items-center justify-center"}><Icono tipo="box"/></span><span className="text-[11px]">Catálogo</span></Link>
      <button type="button" aria-label="Menú de cuenta" aria-expanded={menuUsuario} onClick={() => setMenuUsuario(!menuUsuario)} className={`flex flex-col items-center justify-center gap-0.5 ${menuUsuario ? "text-[#d6001c]" : "text-suave"}`}><span className={menuUsuario ? "flex size-9 items-center justify-center rounded-full bg-[#fdebed]" : "flex size-9 items-center justify-center"}><Icono tipo="users"/></span><span className="text-[11px]">Cuenta</span></button>
    </nav>
    {menuUsuario && <div className="fixed inset-0 z-[60] xl:hidden">
      <button type="button" aria-label="Cerrar menú de cuenta" onClick={() => setMenuUsuario(false)} className="absolute inset-0 bg-black/40"/>
      <section role="dialog" aria-modal="true" aria-label="Menú de cuenta" className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-linea bg-papel p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-linea"/>
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-fondo p-3"><span className="flex size-11 items-center justify-center rounded-full bg-tinta font-semibold text-white">{usuario.name.slice(0,1).toLocaleUpperCase()}</span><span><span className="block font-semibold">{usuario.name}</span><span className="block text-sm text-suave">{NOMBRES_ROL[usuario.role]}</span></span></div>
        {puedeUsuarios && <Link href="/admin/usuarios" onClick={() => setMenuUsuario(false)} className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-fondo"><Icono tipo="users"/>Administrar usuarios y crear cuentas</Link>}
        <div className="mt-1 px-3 py-2"><BotonSalir/></div>
      </section>
    </div>}
  </div>;
}
