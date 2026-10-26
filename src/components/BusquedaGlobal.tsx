"use client";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth-client";
import { aplicarTema, obtenerTema, suscribirTema, type ModoTema } from "@/lib/tema";
import { buscarGlobalAction } from "@/actions/busqueda";
import { marcarListoAccion, reabrirAccion } from "@/actions/presupuestos";
import type { ResultadoBusquedaGlobal } from "@/lib/datos";
import type { EstadoAccion } from "@/lib/tipos";
import { ejemploCafeteriaLaCeiba } from "@/lib/ejemplo-cafeteria";
import { DialogoConfirmar } from "@/components/DialogoConfirmar";

type Props = { abierto: boolean; onCerrar: () => void; puedeCrear: boolean; puedeUsuarios: boolean };
type ContenidoProps = Omit<Props, "abierto">;

export function BusquedaGlobal({ abierto, onCerrar, puedeCrear, puedeUsuarios }: Props) {
  if (!abierto) return null;
  return <ContenidoBusquedaGlobal onCerrar={onCerrar} puedeCrear={puedeCrear} puedeUsuarios={puedeUsuarios} />;
}

function Icono({ tipo, className = "size-4" }: { tipo: "search" | "plus" | "sun" | "moon" | "auto" | "logout" | "home" | "box" | "users" | "file" | "upload" | "check" | "refresh"; className?: string }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
    auto: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></>,
    check: <path d="m5 12 5 5 9-11" />,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
  };
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[tipo]}</svg>;
}

function ContenidoBusquedaGlobal({ onCerrar, puedeCrear, puedeUsuarios }: ContenidoProps) {
  const router = useRouter();
  const ruta = usePathname();
  const temaActivo = useSyncExternalStore(suscribirTema, obtenerTema, () => "automatico");

  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusquedaGlobal | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [salirAbierto, setSalirAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  function cambiarConsulta(valor: string) {
    setConsulta(valor);
    if (!valor.trim()) {
      setResultados(null);
      setCargando(false);
    }
  }

  useEffect(() => {
    const q = consulta.trim();
    if (!q) return;
    let cancelado = false;
    const temporizador = setTimeout(() => {
      if (!cancelado) setCargando(true);
      buscarGlobalAction(q)
        .then((r) => {
          if (!cancelado) setResultados(r);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelado) setCargando(false);
        });
    }, 120);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [consulta]);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCerrar();
      }
    }
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", tecla);
    };
  }, [onCerrar]);

  const q = consulta.trim();
  const idRuta = ruta.match(/^\/presupuestos\/([^/]+)$/)?.[1];
  const idPresupuesto = idRuta && idRuta !== "nuevo" && idRuta !== ejemploCafeteriaLaCeiba.id ? idRuta : undefined;

  function coincide(texto: string) {
    if (!q) return true;
    return texto.toLocaleLowerCase("es-HN").includes(q.toLocaleLowerCase("es-HN"));
  }

  function ir(destino: string) {
    onCerrar();
    router.push(destino);
  }

  function cambiarTema(modo: ModoTema) {
    aplicarTema(modo);
    onCerrar();
  }

  async function ejecutar(accion: (id: string) => Promise<EstadoAccion>) {
    if (!idPresupuesto) return;
    setErrorAccion(null);
    const r = await accion(idPresupuesto).catch(() => ({ error: "No se pudo completar la acción. Intenta de nuevo." }));
    if (r?.error) {
      setErrorAccion(r.error);
      return;
    }
    onCerrar();
    router.refresh();
  }

  async function salir() {
    setSaliendo(true);
    await authClient.signOut();
    onCerrar();
    router.replace("/login");
    router.refresh();
  }

  const acciones = [
    puedeCrear ? { id: "nuevo", titulo: "Nuevo presupuesto", subtitulo: "Crear un presupuesto", icono: "plus" as const, onSelect: () => ir("/presupuestos/nuevo") } : null,
    { id: "tema-claro", titulo: "Tema: Claro", subtitulo: temaActivo === "claro" ? "Actual" : undefined, icono: "sun" as const, onSelect: () => cambiarTema("claro") },
    { id: "tema-oscuro", titulo: "Tema: Oscuro", subtitulo: temaActivo === "oscuro" ? "Actual" : undefined, icono: "moon" as const, onSelect: () => cambiarTema("oscuro") },
    { id: "tema-automatico", titulo: "Tema: Automático", subtitulo: temaActivo === "automatico" ? "Actual" : undefined, icono: "auto" as const, onSelect: () => cambiarTema("automatico") },
    ...(idPresupuesto
      ? [
          ...(puedeCrear ? [{ id: "subir-cotizacion", titulo: "Subir cotización", subtitulo: "Agregar una cotización a este presupuesto", icono: "upload" as const, onSelect: () => ir(`/presupuestos/${idPresupuesto}/cotizaciones/nueva`) }] : []),
          { id: "descargar-excel", titulo: "Descargar Excel", subtitulo: "Exportar el presupuesto listo", icono: "file" as const, onSelect: () => window.open(`/api/presupuestos/${idPresupuesto}/excel`, "_blank") },
          { id: "descargar-pdf", titulo: "Descargar PDF", subtitulo: "Exportar el presupuesto listo", icono: "file" as const, onSelect: () => window.open(`/api/presupuestos/${idPresupuesto}/pdf`, "_blank") },
          { id: "marcar-listo", titulo: "Marcar como listo", subtitulo: "Cerrar el presupuesto para edición", icono: "check" as const, onSelect: () => ejecutar(marcarListoAccion) },
          { id: "reabrir", titulo: "Reabrir", subtitulo: "Volver a editar el presupuesto", icono: "refresh" as const, onSelect: () => ejecutar(reabrirAccion) },
        ]
      : []),
    { id: "cerrar-sesion", titulo: "Cerrar sesión", subtitulo: "Salir de la cuenta", icono: "logout" as const, onSelect: () => setSalirAbierto(true) },
  ].filter(Boolean) as { id: string; titulo: string; subtitulo?: string; icono: "search" | "plus" | "sun" | "moon" | "auto" | "logout" | "home" | "box" | "users" | "file" | "upload" | "check" | "refresh"; onSelect: () => void }[];

  const irA = [
    { id: "ir-presupuestos", titulo: "Presupuestos", subtitulo: "Ver todos los presupuestos", icono: "home" as const, onSelect: () => ir("/presupuestos") },
    { id: "ir-catalogo", titulo: "Catálogo de equipos", subtitulo: "Ver el catálogo", icono: "box" as const, onSelect: () => ir("/catalogo") },
    ...(puedeUsuarios ? [{ id: "ir-usuarios", titulo: "Usuarios", subtitulo: "Administrar usuarios", icono: "users" as const, onSelect: () => ir("/admin/usuarios") }] : []),
  ];

  const accionesFiltradas = acciones.filter((a) => coincide(`${a.titulo} ${a.subtitulo ?? ""}`));
  const irAFiltrados = irA.filter((a) => coincide(`${a.titulo} ${a.subtitulo ?? ""}`));
  const presupuestos = q ? resultados?.presupuestos ?? [] : [];
  const equipos = q ? resultados?.equipos ?? [] : [];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda global"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-linea bg-papel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <Command shouldFilter={false} className="flex flex-col">
          <div className="relative border-b border-linea-2">
            <Icono tipo="search" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-suave" />
            <CommandInput
              autoFocus
              value={consulta}
              onValueChange={cambiarConsulta}
              placeholder="Busca presupuestos, equipos o acciones..."
              className="h-12 w-full bg-transparent pl-11 pr-16 text-sm outline-none placeholder:text-suave"
            />
            <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded bg-fondo px-1.5 py-0.5 text-[10px] text-suave">Esc</kbd>
          </div>

          {errorAccion && (
            <p role="alert" className="border-b border-linea-2 bg-peligro-claro px-4 py-2 text-sm text-peligro">
              {errorAccion}
            </p>
          )}

          <CommandList className="max-h-[60vh] overflow-y-auto p-2">
            <CommandEmpty>
              {cargando ? "Buscando..." : q ? `No se encontró nada para '${q}'` : null}
            </CommandEmpty>

            {accionesFiltradas.length > 0 && (
              <CommandGroup heading="Acciones">
                {accionesFiltradas.map((accion) => (
                  <CommandItem
                    key={accion.id}
                    value={accion.id}
                    onSelect={accion.onSelect}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 data-[selected=true]:bg-fondo data-[selected=true]:text-tinta"
                  >
                    <Icono tipo={accion.icono} className="size-4 shrink-0 text-suave" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{accion.titulo}</span>
                      {accion.subtitulo && <span className="block truncate text-xs text-suave">{accion.subtitulo}</span>}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {irAFiltrados.length > 0 && (
              <CommandGroup heading="Ir a">
                {irAFiltrados.map((enlace) => (
                  <CommandItem
                    key={enlace.id}
                    value={enlace.id}
                    onSelect={enlace.onSelect}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 data-[selected=true]:bg-fondo data-[selected=true]:text-tinta"
                  >
                    <Icono tipo={enlace.icono} className="size-4 shrink-0 text-suave" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{enlace.titulo}</span>
                      {enlace.subtitulo && <span className="block truncate text-xs text-suave">{enlace.subtitulo}</span>}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {presupuestos.length > 0 && (
              <CommandGroup heading="Presupuestos">
                {presupuestos.map((p) => (
                  <CommandItem
                    key={`presupuesto-${p.id}`}
                    value={`presupuesto-${p.id}`}
                    onSelect={() => ir(`/presupuestos/${p.id}`)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 data-[selected=true]:bg-fondo data-[selected=true]:text-tinta"
                  >
                    <Icono tipo="file" className="size-4 shrink-0 text-suave" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{p.nombre}</span>
                      <span className="block truncate text-xs text-suave">{p.restaurante} · {p.estado === "listo" ? "Listo" : "Borrador"}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {equipos.length > 0 && (
              <CommandGroup heading="Equipos">
                {equipos.map((e) => (
                  <CommandItem
                    key={`equipo-${e.id}`}
                    value={`equipo-${e.id}`}
                    onSelect={() => ir(`/catalogo?q=${encodeURIComponent(e.nombre)}`)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 data-[selected=true]:bg-fondo data-[selected=true]:text-tinta"
                  >
                    <Icono tipo="box" className="size-4 shrink-0 text-suave" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{e.nombre}</span>
                      <span className="block truncate text-xs text-suave">{[e.marca, e.modelo].filter(Boolean).join(" · ") || "Sin marca ni modelo"}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-linea-2 px-4 py-2 text-[11px] text-suave">
            <span>↑ ↓ para moverte</span>
            <span>Enter para abrir</span>
            <span>Ctrl+K abre y cierra</span>
          </div>
        </Command>
      </div>

      <DialogoConfirmar
        abierto={salirAbierto}
        titulo="¿Cerrar sesión?"
        descripcion="Tendrás que volver a escribir tu correo y contraseña para entrar."
        textoConfirmar="Cerrar sesión"
        textoProcesando="Cerrando sesión..."
        procesando={saliendo}
        onConfirmar={salir}
        onCancelar={() => setSalirAbierto(false)}
      />
    </div>
  );
}