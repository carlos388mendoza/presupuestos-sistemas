export type ModoTema = "claro" | "oscuro" | "automatico";

export function obtenerTema(): ModoTema {
  if (typeof window === "undefined") return "automatico";
  const guardado = window.localStorage.getItem("tema");
  if (guardado === "claro" || guardado === "oscuro" || guardado === "automatico") return guardado;
  return "automatico";
}

export function esOscuro(modo: ModoTema): boolean {
  if (modo === "oscuro") return true;
  if (modo === "claro") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function aplicarTema(modo: ModoTema): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("tema", modo);
  document.documentElement.classList.toggle("dark", esOscuro(modo));
}

export function iniciarTema(): void {
  if (typeof window === "undefined") return;
  aplicarTema(obtenerTema());
  const consulta = window.matchMedia("(prefers-color-scheme: dark)");
  consulta.addEventListener("change", () => {
    if (obtenerTema() === "automatico") aplicarTema("automatico");
  });
}