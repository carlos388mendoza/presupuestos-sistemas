"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NOMBRES_ROL } from "@/lib/datos";
import { BotonSalir } from "./BotonSalir";
import { BusquedaGlobal } from "@/components/BusquedaGlobal";
import { SelectorTema } from "@/components/SelectorTema";
import { iniciarTema } from "@/lib/tema";

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
  children: React.ReactNode; usuario: { name: string; email: string; role: Rol }; pendientes: number; puedeCrear: boolean; puedeUsuarios: boolean;
}) {
  const ruta = usePathname();
  const router = useRouter();
  const [menuMovil, setMenuMovil] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [buscar, setBuscar] = useState(false);
  const [busquedaGlobal, setBusquedaGlobal] = useState(false);
  const [ayudaAtajos, setAyudaAtajos] = useState(false);
  const inicio = ruta === "/presupuestos";

  useEffect(() => {
    iniciarTema();
  }, []);

  useEffect(() => {
    function esCampoEditable(objetivo: EventTarget | null) {
      if (!(objetivo instanceof HTMLElement)) return false;
      const etiqueta = objetivo.tagName;
      return etiqueta === "INPUT" || etiqueta === "TEXTAREA" || etiqueta === "SELECT" || objetivo.isContentEditable;
    }

    function manejarTecla(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setBusquedaGlobal(true);
        return;
      }
      if (mod && e.key.toLowerCase() === "n" && puedeCrear) {
        e.preventDefault();
        e.stopImmediatePropagation();
        router.push("/presupuestos/nuevo");
        return;
      }
      if (mod && e.key === "/") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setAyudaAtajos(true);
        return;
      }
      if (e.key === "Escape") {
        setBusquedaGlobal(false);
        setAyudaAtajos(false);
        setMenuMovil(false);
        setMenuUsuario(false);
        return;
      }
      if (e.key === "?" && !mod && !esCampoEditable(e.target)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setAyudaAtajos(true);
      }
    }

    window.addEventListener("keydown", manejarTecla, true);
    return () => window.removeEventListener("keydown", manejarTecla, true);
  }, [puedeCrear, router]);

  const secciones = [
    { titulo: "GENERAL", enlaces: [{ href: "/presupuestos", texto: "Presupuestos", icono: "home" as const, badge: undefined }] },
    { titulo: "CATÁLOGO", enlaces: [{ href: "/catalogo", texto: "Catálogo de equipos", icono: "box" as const, badge: pendientes }] },
    ...(puedeUsuarios ? [{ titulo: "ADMINISTRACIÓN", enlaces: [{ href: "/admin/usuarios", texto: "Usuarios", icono: "users" as const, badge: undefined }] }] : []),
  ];
  return <div className="min-h-screen">
    <aside className="hidden xl:fixed xl:inset-y-0 xl:left-0 xl:z-40 xl:flex xl:w-80 xl:flex-col xl:border-r xl:border-linea xl:bg-papel">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-linea-2 px-4 xl:py-0">
        <Image src="/logo-grupo-comidas-circulo-96.png" alt="Grupo Comidas" width={96} height={96} className="size-11 shrink-0"/>
        <span className="min-w-0"><span className="block truncate text-lg font-semibold">Presupuestos</span><span className="block truncate text-sm text-suave">Grupo Comidas · Sistemas</span></span>
      </div>
      {puedeCrear && <div className="shrink-0 px-4 pt-4"><Link href="/presupuestos/nuevo" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-tinta px-3 text-sm font-semibold text-white transition-colors hover:bg-tinta-2"><Icono tipo="plus" className="size-4"/>Nuevo presupuesto</Link></div>}
      <nav aria-label="Navegación principal" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {secciones.map((seccion) => <section key={seccion.titulo}>
          <h2 className="px-3 pb-2 text-[11px] font-semibold tracking-wide text-suave">{seccion.titulo}</h2>
          <div className="space-y-1">{seccion.enlaces.map((e) => <Link key={e.href} href={e.href} aria-current={ruta === e.href ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${ruta === e.href ? "bg-hnl-claro font-medium text-hnl" : "text-tinta-2 hover:bg-fondo"}`}><Icono tipo={e.icono} className="size-[18px]"/><span className="min-w-0 flex-1 truncate">{e.texto}</span>{!!e.badge && <span className="rounded-full bg-fondo px-2 py-0.5 text-xs text-suave">{e.badge}</span>}</Link>)}</div>
        </section>)}
      </nav>
      <footer className="shrink-0 border-t border-linea px-4 py-3">
        <div className="mb-3 flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-hnl text-sm font-semibold text-white">{usuario.name.slice(0,1).toLocaleUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{usuario.name}</span><span className="block truncate text-xs text-suave">{usuario.email} · {NOMBRES_ROL[usuario.role]}</span></span></div>
        <div className="mb-3"><SelectorTema/></div>
        <BotonSalir/>
      </footer>
    </aside>
    <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-linea bg-papel px-3 sm:px-5 xl:ml-80">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3 xl:hidden">
        <button type="button" aria-label={menuMovil ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuMovil} onClick={() => setMenuMovil(!menuMovil)} className="shrink-0 rounded-md p-2 text-tinta hover:bg-fondo"><Icono tipo={menuMovil ? "close" : "menu"}/></button>
        <Link href="/presupuestos" className="flex min-w-0 items-center gap-2"><Image src="/logo-grupo-comidas-circulo-96.png" alt="Grupo Comidas" width={96} height={96} className="size-9 shrink-0"/><span className="truncate font-semibold">Presupuestos</span></Link>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setBusquedaGlobal(true)} className="hidden h-11 w-[min(22rem,32vw)] items-center gap-2 rounded-full border border-linea px-4 text-left xl:flex" aria-label="Buscar en todo">
          <Icono tipo="search" className="size-[18px] shrink-0 text-suave"/>
          <span className="min-w-0 flex-1 truncate text-sm text-suave">Buscar…</span>
          <kbd className="shrink-0 rounded bg-fondo px-1.5 py-0.5 text-[10px] text-suave">Ctrl K</kbd>
        </button>
        <button type="button" onClick={() => setBusquedaGlobal(true)} className="shrink-0 rounded-md p-2 text-tinta hover:bg-fondo xl:hidden" aria-label="Buscar en todo">
          <Icono tipo="search"/>
        </button>
      </div>
    </header>
    <main className="min-w-0 px-4 pb-24 pt-5 sm:px-6 xl:ml-80 xl:px-8 xl:py-7">
      {menuMovil && <div className="fixed inset-0 z-50">
        <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-black/40" onClick={() => setMenuMovil(false)}/>
        <nav aria-label="Menú de navegación" className="absolute inset-y-0 left-0 flex w-[min(84vw,21rem)] flex-col border-r border-linea bg-papel shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-linea-2 px-4 py-3">
            <Link href="/presupuestos" onClick={() => setMenuMovil(false)} className="flex min-w-0 items-center gap-3"><Image src="/logo-grupo-comidas-circulo-96.png" alt="" width={96} height={96} className="size-10 shrink-0"/><span className="min-w-0"><span className="block truncate font-semibold">Presupuestos</span><span className="block truncate text-sm text-suave">Grupo Comidas · Sistemas</span></span></Link>
            <button type="button" aria-label="Cerrar menú" onClick={() => setMenuMovil(false)} className="ml-2 shrink-0 rounded-md p-2 text-suave hover:bg-fondo"><Icono tipo="close"/></button>
          </div>
          {puedeCrear && <div className="shrink-0 px-4 pt-4"><Link href="/presupuestos/nuevo" onClick={() => setMenuMovil(false)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-tinta px-3 text-sm font-semibold text-white transition-colors hover:bg-tinta-2"><Icono tipo="plus" className="size-4"/>Nuevo presupuesto</Link></div>}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5">
            {secciones.map((seccion) => <section key={seccion.titulo}>
              <h2 className="px-3 pb-2 text-[11px] font-semibold tracking-wide text-suave">{seccion.titulo}</h2>
              <div className="space-y-1">{seccion.enlaces.map((e) => <Link key={e.href} href={e.href} onClick={() => setMenuMovil(false)} aria-current={ruta === e.href ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${ruta === e.href ? "bg-hnl-claro font-medium text-hnl" : "text-tinta-2 hover:bg-fondo"}`}><Icono tipo={e.icono} className="size-[18px]"/><span className="min-w-0 flex-1 truncate">{e.texto}</span>{!!e.badge && <span className="rounded-full bg-fondo px-2 py-0.5 text-xs text-suave">{e.badge}</span>}</Link>)}</div>
            </section>)}
          </div>
          <footer className="shrink-0 border-t border-linea px-4 py-3">
            <div className="mb-3 flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-hnl text-sm font-semibold text-white">{usuario.name.slice(0,1).toLocaleUpperCase()}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{usuario.name}</span><span className="block truncate text-xs text-suave">{usuario.email} · {NOMBRES_ROL[usuario.role]}</span></span>
            </div>
            <div className="mb-3 px-3"><SelectorTema/></div>
            <BotonSalir/>
          </footer>
        </nav>
      </div>}
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
    <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-40 grid h-[4.5rem] grid-cols-4 border-t border-linea bg-papel/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden">
      <Link href="/presupuestos" aria-label="Inicio, presupuestos" className={`flex flex-col items-center justify-center gap-0.5 ${inicio ? "text-hnl" : "text-suave"}`}><span className={inicio ? "flex size-9 items-center justify-center rounded-full bg-hnl-claro" : "flex size-9 items-center justify-center"}><Icono tipo="home"/></span><span className="text-[11px]">Inicio</span></Link>
      <Link href="/catalogo" aria-label="Catálogo de equipos" className={`flex flex-col items-center justify-center gap-0.5 ${ruta.startsWith("/catalogo") ? "text-hnl" : "text-suave"}`}><span className={ruta.startsWith("/catalogo") ? "flex size-9 items-center justify-center rounded-full bg-hnl-claro" : "flex size-9 items-center justify-center"}><Icono tipo="box"/></span><span className="text-[11px]">Catálogo</span></Link>
      <button type="button" aria-label="Menú de cuenta" aria-expanded={menuUsuario} onClick={() => setMenuUsuario(!menuUsuario)} className={`flex flex-col items-center justify-center gap-0.5 ${menuUsuario ? "text-hnl" : "text-suave"}`}><span className={menuUsuario ? "flex size-9 items-center justify-center rounded-full bg-hnl-claro" : "flex size-9 items-center justify-center"}><Icono tipo="users"/></span><span className="text-[11px]">Cuenta</span></button>
      {puedeCrear ? <Link href="/presupuestos/nuevo" aria-label="Nuevo presupuesto" className="flex flex-col items-center justify-center gap-0.5 text-suave"><span className="flex size-9 items-center justify-center rounded-full bg-tinta text-white"><Icono tipo="plus"/></span><span className="text-[11px]">Nuevo</span></Link> : <span aria-hidden className="size-9"/>}
    </nav>
    {menuUsuario && <div className="fixed inset-0 z-[60] xl:hidden">
      <button type="button" aria-label="Cerrar menú de cuenta" onClick={() => setMenuUsuario(false)} className="absolute inset-0 bg-black/40"/>
      <section role="dialog" aria-modal="true" aria-label="Menú de cuenta" className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-linea bg-papel p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-linea"/>
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-fondo p-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hnl font-semibold text-white">{usuario.name.slice(0,1).toLocaleUpperCase()}</span><span className="min-w-0"><span className="block truncate font-semibold">{usuario.name}</span><span className="block truncate text-xs text-suave">{usuario.email} · {NOMBRES_ROL[usuario.role]}</span></span></div>
        {puedeUsuarios && <Link href="/admin/usuarios" onClick={() => setMenuUsuario(false)} className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-fondo"><Icono tipo="users"/>Administrar usuarios y crear cuentas</Link>}
        <div className="mt-1 px-3 py-2"><SelectorTema/></div>
        <div className="mt-1 px-3 py-2"><BotonSalir/></div>
      </section>
    </div>}
  <BusquedaGlobal abierto={busquedaGlobal} onCerrar={() => setBusquedaGlobal(false)} puedeCrear={puedeCrear} puedeUsuarios={puedeUsuarios} />
  {ayudaAtajos && (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" aria-label="Atajos de teclado" className="panel w-full max-w-md p-5">
        <h2 className="mb-3 font-semibold">Atajos de teclado</h2>
        <ul className="space-y-2 text-sm">
          <li><span className="cifra rounded bg-fondo px-2 py-1">Ctrl/Cmd + K</span> Buscar en todo</li>
          <li><span className="cifra rounded bg-fondo px-2 py-1">Ctrl/Cmd + N</span> Nuevo presupuesto</li>
          <li><span className="cifra rounded bg-fondo px-2 py-1">Ctrl/Cmd + /</span> Mostrar esta ayuda</li>
          <li><span className="cifra rounded bg-fondo px-2 py-1">?</span> Mostrar esta ayuda</li>
          <li><span className="cifra rounded bg-fondo px-2 py-1">Esc</span> Cerrar ventanas</li>
        </ul>
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-secundario" onClick={() => setAyudaAtajos(false)}>Cerrar</button>
        </div>
      </div>
    </div>
  )}
  </div>;
}
