// Componentes de formulario reutilizables. Ejemplo:
//   <CampoTexto name="email" type="email" etiqueta="Correo" required />
//   <CampoContrasena name="password" etiqueta="Contraseña" autoComplete="current-password" />
//   <CampoSelect name="role" etiqueta="Rol" defaultValue="creador"><option value="creador">Creador</option></CampoSelect>
//   <AreaTexto name="notas" etiqueta="Notas" opcional rows={3} />
//   <Casilla name="pendientes" value="1" etiqueta="Solo por revisar" />
//   <OpcionRadio name="tipo" value="apertura" etiqueta="Apertura" />
//   <GrupoOpciones name="tipo" etiqueta="Tipo" defaultValue="a" opciones={[{ valor: "a", etiqueta: "A", descripcion: "…" }]} />
export { Campo, CampoTexto, AreaTexto, CampoSelect, Casilla, OpcionRadio, GrupoOpciones } from "./Campos";
export type { CampoTextoProps, AreaTextoProps, CampoSelectProps, Opcion } from "./Campos";
export { CampoContrasena } from "./CampoContrasena";
