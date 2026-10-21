import Link from "next/link";
import { redirect } from "next/navigation";
import { requerirUsuario } from "@/lib/sesion";
import { puedeCrearPresupuestos } from "@/lib/datos";
import { crearPresupuesto } from "@/actions/presupuestos";
import { FormAccion } from "@/components/FormAccion";
import { CamposPresupuesto } from "../CamposPresupuesto";

const SUGERIDAS = ["Red y cableado", "Puntos de venta", "Cámaras de seguridad", "Impresoras", "Telefonía", "Licencias"];

export default async function NuevoPresupuesto() {
  const usuario = await requerirUsuario();
  if (!puedeCrearPresupuestos(usuario)) redirect("/presupuestos");
  return (
    <div className="max-w-2xl">
      <Link href="/presupuestos" className="btn-texto -ml-1.5 mb-2">Volver a presupuestos</Link>
      <h1 className="titulo-pagina mb-6">Nuevo presupuesto</h1>
      <FormAccion action={crearPresupuesto} className="panel space-y-5 p-6">
        <CamposPresupuesto />
        <div>
          <label htmlFor="partidas" className="etiqueta">Partidas iniciales</label>
          <textarea
            id="partidas"
            name="partidas"
            rows={6}
            className="campo"
            defaultValue={SUGERIDAS.join("\n")}
          />
          <p className="ayuda mt-1">
            Una por línea. Cada partida es algo que hay que comprar y puede tener varias cotizaciones. Puedes cambiarlas
            después.
          </p>
        </div>
        <button type="submit" className="btn-primario">Crear presupuesto</button>
      </FormAccion>
    </div>
  );
}
