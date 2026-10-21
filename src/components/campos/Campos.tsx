import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/*
 * Campos de formulario con el diseño de la app (clases `campo`, `etiqueta`, `casilla`, `opcion-radio`).
 * Funcionan en componentes de servidor y de cliente, con o sin estado (defaultValue o value).
 * Si se pasa `etiqueta`, el campo lleva su <label>; `id` se toma de `name` si no se indica.
 */

type ConEtiqueta = {
  etiqueta?: ReactNode;
  /** Agrega "(opcional)" junto a la etiqueta. */
  opcional?: boolean;
  /** Texto de ayuda debajo del campo. */
  ayuda?: ReactNode;
  /** Clase del contenedor (etiqueta + campo + ayuda). */
  classNameContenedor?: string;
};

function unir(...clases: (string | false | undefined)[]) {
  return clases.filter(Boolean).join(" ");
}

/** Etiqueta + control + ayuda. Úsalo para controles propios que no son input, select ni textarea. */
export function Campo({
  id,
  etiqueta,
  opcional,
  ayuda,
  classNameContenedor,
  children,
}: ConEtiqueta & { id?: string; children: ReactNode }) {
  if (!etiqueta && !ayuda) return <>{children}</>;
  return (
    <div className={classNameContenedor}>
      {etiqueta && (
        <label htmlFor={id} className="etiqueta">
          {etiqueta}
          {opcional && <span className="font-normal text-suave"> (opcional)</span>}
        </label>
      )}
      {children}
      {ayuda && (
        <p id={id ? `${id}-ayuda` : undefined} className="ayuda mt-1.5">
          {ayuda}
        </p>
      )}
    </div>
  );
}

export type CampoTextoProps = ConEtiqueta & InputHTMLAttributes<HTMLInputElement>;

export function CampoTexto({ etiqueta, opcional, ayuda, classNameContenedor, className, id, ...props }: CampoTextoProps) {
  const idCampo = id ?? props.name;
  return (
    <Campo id={idCampo} etiqueta={etiqueta} opcional={opcional} ayuda={ayuda} classNameContenedor={classNameContenedor}>
      <input
        id={idCampo}
        aria-describedby={ayuda && idCampo ? `${idCampo}-ayuda` : undefined}
        className={unir("campo", className)}
        {...props}
      />
    </Campo>
  );
}

export type AreaTextoProps = ConEtiqueta & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function AreaTexto({ etiqueta, opcional, ayuda, classNameContenedor, className, id, ...props }: AreaTextoProps) {
  const idCampo = id ?? props.name;
  return (
    <Campo id={idCampo} etiqueta={etiqueta} opcional={opcional} ayuda={ayuda} classNameContenedor={classNameContenedor}>
      <textarea
        id={idCampo}
        aria-describedby={ayuda && idCampo ? `${idCampo}-ayuda` : undefined}
        className={unir("campo", className)}
        {...props}
      />
    </Campo>
  );
}

export type CampoSelectProps = ConEtiqueta & SelectHTMLAttributes<HTMLSelectElement>;

/** Select nativo (accesible y cómodo en celular) con la flecha y bordes de la app. */
export function CampoSelect({ etiqueta, opcional, ayuda, classNameContenedor, className, id, children, ...props }: CampoSelectProps) {
  const idCampo = id ?? props.name;
  return (
    <Campo id={idCampo} etiqueta={etiqueta} opcional={opcional} ayuda={ayuda} classNameContenedor={classNameContenedor}>
      <select
        id={idCampo}
        aria-describedby={ayuda && idCampo ? `${idCampo}-ayuda` : undefined}
        className={unir("campo", className)}
        {...props}
      >
        {children}
      </select>
    </Campo>
  );
}

type MarcaProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Texto junto a la casilla. */
  etiqueta: ReactNode;
  /** Texto secundario debajo de la etiqueta. */
  descripcion?: ReactNode;
  classNameContenedor?: string;
};

function Marca({ tipo, etiqueta, descripcion, classNameContenedor, className, ...props }: MarcaProps & { tipo: "checkbox" | "radio" }) {
  return (
    <label className={unir("flex cursor-pointer items-start gap-2.5 text-sm", classNameContenedor)}>
      <input type={tipo} className={unir(tipo === "checkbox" ? "casilla" : "opcion-radio", "mt-0.5", className)} {...props} />
      <span className="min-w-0">
        <span className="block">{etiqueta}</span>
        {descripcion && <span className="block text-suave">{descripcion}</span>}
      </span>
    </label>
  );
}

export type Opcion<V extends string = string> = { valor: V; etiqueta: ReactNode; descripcion?: ReactNode };

type GrupoOpcionesProps<V extends string> = {
  name: string;
  /** Título del grupo (legend). */
  etiqueta: ReactNode;
  opciones: Opcion<V>[];
  /** Sin estado: valor inicial. */
  defaultValue?: V;
  /** Con estado: valor actual y cambio. */
  value?: V;
  onChange?: (valor: V) => void;
  required?: boolean;
  /** Opciones lado a lado desde tamaño `sm` (por defecto) o una debajo de otra. */
  enColumnas?: boolean;
  className?: string;
};

/** Choice box: opciones excluyentes como tarjetas seleccionables (radios accesibles por dentro). */
export function GrupoOpciones<V extends string>({
  name,
  etiqueta,
  opciones,
  defaultValue,
  value,
  onChange,
  required,
  enColumnas = true,
  className,
}: GrupoOpcionesProps<V>) {
  return (
    <fieldset className={className}>
      <legend className="etiqueta">{etiqueta}</legend>
      <div className={unir("grid gap-2", enColumnas && "sm:grid-cols-2")}>
        {opciones.map((o) => (
          <label
            key={o.valor}
            className="flex cursor-pointer items-start justify-between gap-3 rounded-md border border-linea bg-papel px-3.5 py-3 text-sm transition-colors hover:border-tinta-2 has-[:checked]:border-tinta has-[:checked]:bg-fondo/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hnl"
          >
            <span className="min-w-0">
              <span className="block font-medium">{o.etiqueta}</span>
              {o.descripcion && <span className="block text-suave">{o.descripcion}</span>}
            </span>
            <input
              type="radio"
              name={name}
              value={o.valor}
              required={required}
              className="opcion-radio mt-0.5 focus-visible:outline-none"
              {...(value !== undefined
                ? { checked: value === o.valor, onChange: () => onChange?.(o.valor) }
                : { defaultChecked: defaultValue === o.valor })}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Casilla(props: MarcaProps) {
  return <Marca tipo="checkbox" {...props} />;
}

export function OpcionRadio(props: MarcaProps) {
  return <Marca tipo="radio" {...props} />;
}
