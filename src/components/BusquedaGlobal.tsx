"use client";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "cmdk";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { aplicarTema, type ModoTema } from "@/lib/tema";
import { buscarGlobalAction } from "@/actions/busqueda";
import { marcarListoAccion, reabrirAccion } from "@/actions/presupuestos";
import type { ResultadoBusquedaGlobal } from "@/lib/datos";

type Props = { abierto: boolean; onCerrar: () => void; puedeCrear: boolean; puedeUsuarios: boolean };

export function BusquedaGlobal({ abierto, onCerrar, puedeCrear, puedeUsuarios }: Props) {
  const router = useRouter();
  const ruta = usePathname();
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusquedaGlobal | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setConsulta("");
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    let cancelado = false;
    const temporizador = setTimeout(() => {
      setCargando(true);
      buscarGlobalAction(consulta)
        .then((r) => {
          if (!cancelado) setResultados(r);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelado) setCargando(false);
        });
    }, consulta ? 120 : 0);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [consulta, abierto]);

  useEffect(() => {
    if (!abierto) return;
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
  }, [abierto, onCerrar]);

  const idPresupuesto = ruta.match(/^\/presupuestos\/([^/]+)$/)?.[1];

  function ir(destino: string) {
    onCerrar();
    router.push(destino);
  }

  async function cerrarSesion() {
    onCerrar();
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  function cambiarTema(modo: ModoTema) {
    aplicarTema(modo);
    onCerrar();
  }

  async function marcarListo() {
    if (!idPresupuesto) return;
    await marcarListoAccion(idPresupuesto);
    onCerrar();
    router.refresh();
  }

  async function reabrir() {
    if (!idPresupuesto) return;
    await reabrirAccion(idPresupuesto);
    onCerrar();
    router.refresh();
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 p-4 pt-[12vh]" onClick={onCerrar}>
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-linea bg-papel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <Command shouldFilter={false}>
          <CommandInput
            autoFocus
            value={consulta}
            onValueChange={setConsulta}
            placeholder="Buscar o ejecutar una acción…"
            className="h-11 w-full border-b border-linea-2 bg-transparent px-4 text-sm outline-none placeholder:text-suave"
          />
          <CommandList className="max-h-[60vh] overflow-y-auto p-2">
            <CommandEmpty>{cargando ? "Cargando…" : "Sin resultados."}</CommandEmpty>

            <CommandGroup heading="Navegación">
              <CommandItem onSelect={() => ir("/presupuestos")}>Presupuestos</CommandItem>
              <CommandItem onSelect={() => ir("/catalogo")}>Catálogo de equipos</CommandItem>
              {puedeUsuarios && <CommandItem onSelect={() => ir("/admin/usuarios")}>Usuarios</CommandItem>}
              {puedeCrear && <CommandItem onSelect={() => ir("/presupuestos/nuevo")}>Nuevo presupuesto</CommandItem>}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Acciones">
              <CommandItem onSelect={() => cerrarSesion()}>Cerrar sesión</CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Ajustes">
              <CommandItem onSelect={() => cambiarTema("claro")}>Tema: claro</CommandItem>
              <CommandItem onSelect={() => cambiarTema("oscuro")}>Tema: oscuro</CommandItem>
              <CommandItem onSelect={() => cambiarTema("automatico")}>Tema: automático</CommandItem>
            </CommandGroup>

            {idPresupuesto && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Este presupuesto">
                  <CommandItem onSelect={() => ir(`/presupuestos/${idPresupuesto}/cotizaciones/nueva`)}>Subir cotización</CommandItem>
                  <CommandItem onSelect={() => window.open(`/api/presupuestos/${idPresupuesto}/excel`, "_blank")}>Descargar Excel</CommandItem>
                  <CommandItem onSelect={() => window.open(`/api/presupuestos/${idPresupuesto}/pdf`, "_blank")}>Descargar PDF</CommandItem>
                  <CommandItem onSelect={() => marcarListo()}>Marcar como listo</CommandItem>
                  <CommandItem onSelect={() => reabrir()}>Reabrir</CommandItem>
                </CommandGroup>
              </>
            )}

            {resultados?.presupuestos.length ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Presupuestos">
                  {resultados.presupuestos.map((p) => (
                    <CommandItem key={p.id} onSelect={() => ir(`/presupuestos/${p.id}`)}>
                      {p.nombre} <span className="text-suave">· {p.restaurante}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            {resultados?.equipos.length ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Equipos">
                  {resultados.equipos.map((e) => (
                    <CommandItem key={e.id} onSelect={() => ir(`/catalogo?q=${encodeURIComponent(e.nombre)}`)}>
                      {e.nombre} <span className="text-suave">· {[e.marca, e.modelo].filter(Boolean).join(" ")}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            {resultados?.usuarios.length ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Usuarios">
                  {resultados.usuarios.map((u) => (
                    <CommandItem key={u.id} onSelect={() => ir("/admin/usuarios")}>
                      {u.name} <span className="text-suave">· {u.email}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </div>
    </div>
  );
}