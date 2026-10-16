import type { Moneda, TipoCompra } from "@/db/schema";

/** Ítem tal como lo maneja el editor de alternativas en el navegador. */
export type ItemBorrador = {
  equipoId: string | null;
  equipoNombre: string | null;
  /** true = no existe en el catálogo y se creará al guardar */
  nuevo: boolean;
  descripcion: string;
  marca: string;
  modelo: string;
  cantidad: number;
  precioUnitarioCentavos: number;
  moneda: Moneda;
};

export type BorradorAlternativa = {
  proveedor: string;
  tipoCompra: TipoCompra;
  items: ItemBorrador[];
};

export type RespuestaExtraccion = {
  archivoId: string;
  archivoNombre: string;
  borrador?: BorradorAlternativa;
  aviso?: string;
  error?: string;
};

export type EstadoAccion = { error?: string; ok?: string } | null;
