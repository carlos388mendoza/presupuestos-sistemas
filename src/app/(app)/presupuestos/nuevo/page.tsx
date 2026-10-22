import Link from "next/link";
import { redirect } from "next/navigation";
import { requerirUsuario } from "@/lib/sesion";
import { puedeCrearPresupuestos } from "@/lib/datos";
import { crearPresupuesto } from "@/actions/presupuestos";
import { FormAccion } from "@/components/FormAccion";
import { SelectorCreable } from "@/components/campos";
import { CamposPresupuesto } from "../CamposPresupuesto";

const PARTIDAS_INICIALES = ["Red y cableado", "Puntos de venta", "Cámaras de seguridad", "Impresoras", "Telefonía", "Licencias"];
const SUGERIDAS = [
  "Red y cableado",
  "Puntos de venta",
  "Cámaras de seguridad",
  "Impresoras",
  "Telefonía",
  "Licencias",
  "Computadoras y laptops",
  "Monitores y periféricos",
  "Servidores y almacenamiento",
  "Energía y UPS",
  "Software y suscripciones",
  "Seguridad informática",
  "Audio y videoconferencia",
  "Instalación y configuración",
  "Mantenimiento y soporte",
];

export default async function NuevoPresupuesto() {
  const usuario = await requerirUsuario();
  if (!puedeCrearPresupuestos(usuario)) redirect("/presupuestos");
  return (
    <div className="max-w-2xl">
      <Link href="/presupuestos" className="btn-texto -ml-1.5 mb-2">Volver a presupuestos</Link>
      <h1 className="titulo-pagina mb-6">Nuevo presupuesto</h1>
      <FormAccion action={crearPresupuesto} className="panel formulario p-6">
        <CamposPresupuesto />
        <SelectorCreable
          name="partidas"
          etiqueta="Partidas iniciales"
          sugeridas={SUGERIDAS}
          defaultSeleccion={PARTIDAS_INICIALES}
          placeholder="Escribe una partida o elige una sugerida"
          ayuda="Cada partida es algo que hay que comprar y puede tener varias cotizaciones. Escribe una nueva y presiona Enter. Puedes cambiarlas después."
        />
        <button type="submit" className="btn-primario self-start">Crear presupuesto</button>
      </FormAccion>
    </div>
  );
}
