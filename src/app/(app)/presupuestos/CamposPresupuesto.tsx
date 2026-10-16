type Valores = { nombre?: string; restaurante?: string; tipo?: string; notas?: string };

export function CamposPresupuesto({ valores = {} }: { valores?: Valores }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="restaurante" className="etiqueta">Restaurante</label>
          <input id="restaurante" name="restaurante" required maxLength={200} className="campo"
            defaultValue={valores.restaurante} placeholder="Ej. Sucursal City Mall" />
        </div>
        <div>
          <label htmlFor="nombre" className="etiqueta">Nombre del presupuesto</label>
          <input id="nombre" name="nombre" required maxLength={200} className="campo"
            defaultValue={valores.nombre} placeholder="Ej. Apertura 2026" />
        </div>
      </div>
      <fieldset>
        <legend className="etiqueta">Tipo de proyecto</legend>
        <div className="flex gap-4">
          {[
            ["apertura", "Apertura"],
            ["remodelacion", "Remodelación"],
          ].map(([v, t]) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input type="radio" name="tipo" value={v} required defaultChecked={(valores.tipo ?? "apertura") === v} />
              {t}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="notas" className="etiqueta">Notas <span className="font-normal text-suave">(opcional)</span></label>
        <textarea id="notas" name="notas" rows={2} maxLength={2000} className="campo" defaultValue={valores.notas} />
      </div>
    </>
  );
}
