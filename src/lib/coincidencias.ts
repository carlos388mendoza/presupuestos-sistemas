/** Normaliza textos para comparar equipos: minúsculas, sin acentos ni signos. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compacto(texto: string): string {
  return normalizar(texto).replace(/\s+/g, "");
}

export type EquipoComparable = { id: string; nombre: string; marca: string; modelo: string };

/**
 * Busca un equipo del catálogo que corresponda a un ítem de cotización.
 * 1) Marca + modelo exactos (normalizados).
 * 2) Modelo exacto si es suficientemente específico.
 * 3) Nombre igual, o similitud de palabras alta.
 */
export function buscarCoincidencia<T extends EquipoComparable>(
  item: { descripcion: string; marca: string; modelo: string },
  catalogo: T[],
): T | null {
  const modelo = compacto(item.modelo);
  const marca = compacto(item.marca);

  if (modelo) {
    const exacto = catalogo.find((e) => compacto(e.modelo) === modelo && (!marca || compacto(e.marca) === marca));
    if (exacto) return exacto;
    if (modelo.length >= 5) {
      const porModelo = catalogo.find((e) => compacto(e.modelo) === modelo);
      if (porModelo) return porModelo;
    }
  }

  const desc = normalizar(item.descripcion);
  if (!desc) return null;
  const igual = catalogo.find((e) => normalizar(e.nombre) === desc);
  if (igual) return igual;

  let mejor: { e: T; puntaje: number } | null = null;
  for (const e of catalogo) {
    const p = similitud(desc, normalizar(`${e.nombre} ${e.marca} ${e.modelo}`));
    if (!mejor || p > mejor.puntaje) mejor = { e, puntaje: p };
  }
  return mejor && mejor.puntaje >= 0.75 ? mejor.e : null;
}

/** Proporción de palabras de `a` (de 3+ letras) presentes en `b`. */
export function similitud(a: string, b: string): number {
  const pa = a.split(" ").filter((w) => w.length >= 3);
  if (pa.length === 0) return 0;
  const pb = new Set(b.split(" "));
  return pa.filter((w) => pb.has(w)).length / pa.length;
}
