// Límites compartidos entre el navegador y el servidor.

// Vercel rechaza cuerpos de más de 4.5 MB en sus funciones; se deja margen
// para el resto del formulario.
export const TAMANO_MAXIMO_ARCHIVO = 4 * 1024 * 1024; // 4 MB
export const MENSAJE_ARCHIVO_GRANDE =
  "El archivo pasa de 4 MB. Comprime el PDF o toma una foto más liviana e intenta de nuevo.";
