import { AreaTexto, CampoTexto, OpcionRadio } from "@/components/campos";

type Valores = { nombre?: string; restaurante?: string; tipo?: string; notas?: string };

export function CamposPresupuesto({ valores = {} }: { valores?: Valores }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto name="restaurante" etiqueta="Restaurante" required maxLength={200}
          defaultValue={valores.restaurante} placeholder="Ej. Sucursal City Mall" />
        <CampoTexto name="nombre" etiqueta="Nombre del presupuesto" required maxLength={200}
          defaultValue={valores.nombre} placeholder="Ej. Apertura 2026" />
      </div>
      <fieldset>
        <legend className="etiqueta">Tipo de proyecto</legend>
        <div className="flex gap-4">
          {[
            ["apertura", "Apertura"],
            ["remodelacion", "Remodelación"],
          ].map(([v, t]) => (
            <OpcionRadio key={v} name="tipo" value={v} etiqueta={t} required
              defaultChecked={(valores.tipo ?? "apertura") === v} />
          ))}
        </div>
      </fieldset>
      <AreaTexto name="notas" etiqueta="Notas" opcional rows={2} maxLength={2000} defaultValue={valores.notas} />
    </>
  );
}
