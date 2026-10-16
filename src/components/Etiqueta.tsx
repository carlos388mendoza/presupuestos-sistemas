const ESTILOS = {
  borrador: "bg-linea-2 text-tinta-2",
  listo: "bg-usd-claro text-usd",
  aviso: "bg-aviso-claro text-aviso",
  nacional: "bg-linea-2 text-tinta-2",
  internacional: "bg-hnl-claro text-hnl",
  nuevo: "bg-aviso-claro text-aviso",
} as const;

export function Etiqueta({ tipo, children }: { tipo: keyof typeof ESTILOS; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${ESTILOS[tipo]}`}>
      {children}
    </span>
  );
}
