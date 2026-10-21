import { AreaTexto, CampoTexto, GrupoOpciones } from "@/components/campos";

type Valores = { nombre?: string; restaurante?: string; tipo?: string; notas?: string };

export function CamposPresupuesto({ valores = {} }: { valores?: Valores }) {
  return (
    <>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <CampoTexto name="restaurante" etiqueta="Restaurante" required maxLength={200}
          defaultValue={valores.restaurante} placeholder="Ej. Sucursal City Mall" />
        <CampoTexto name="nombre" etiqueta="Nombre del presupuesto" required maxLength={200}
          defaultValue={valores.nombre} placeholder="Ej. Apertura 2026" />
      </div>
      <GrupoOpciones
        name="tipo"
        etiqueta="Tipo de proyecto"
        required
        defaultValue={valores.tipo ?? "apertura"}
        opciones={[
          { valor: "apertura", etiqueta: "Apertura", descripcion: "Restaurante nuevo." },
          { valor: "remodelacion", etiqueta: "Remodelación", descripcion: "Restaurante que ya existe." },
        ]}
      />
      <AreaTexto name="notas" etiqueta="Notas" opcional rows={2} maxLength={2000} defaultValue={valores.notas} />
    </>
  );
}
