export const ejemploCafeteriaLaCeiba = {
  id: "ejemplo-presupuesto-cafeteria-ceiba",
  nombre: "KFC ceiba ejemplo",
  restaurante: "Cafetería Brisa del Caribe (ficticia) · La Ceiba",
  tipo: "remodelacion" as const,
  estado: "borrador" as const,
  notas: "Todos los datos, equipos, proveedores, precios y cotizaciones de este presupuesto son completamente ficticios y se incluyen solo para demostración.",
  partidas: [
    {
      id: "ejemplo-ceiba-red-wifi",
      nombre: "Red y Wi-Fi",
      alternativas: [
        {
          id: "ejemplo-ceiba-red-wifi-nacional",
          proveedor: "Conexión Caribeña (proveedor ficticio)",
          tipoCompra: "nacional" as const,
          elegida: true,
          notas: "Cotización y precios completamente ficticios en HNL.",
          items: [
            { descripcion: "Punto de red Cat 6 instalado", cantidad: 12, precioUnitarioCentavos: 142000, moneda: "HNL" as const },
            { descripcion: "Access point Wi-Fi 6", cantidad: 3, precioUnitarioCentavos: 1890000, moneda: "HNL" as const },
            { descripcion: "Switch PoE administrable de 16 puertos", cantidad: 1, precioUnitarioCentavos: 3150000, moneda: "HNL" as const },
            { descripcion: "Configuración y cobertura Wi-Fi", cantidad: 1, precioUnitarioCentavos: 975000, moneda: "HNL" as const },
          ],
        },
        {
          id: "ejemplo-ceiba-red-wifi-internacional",
          proveedor: "Isla Network Supply (proveedor ficticio)",
          tipoCompra: "internacional" as const,
          elegida: false,
          notas: "Cotización ficticia en USD; no incluye impuestos ni flete.",
          items: [
            { descripcion: "Access point Wi-Fi 6", cantidad: 3, precioUnitarioCentavos: 12800, moneda: "USD" as const },
            { descripcion: "Switch PoE administrable de 16 puertos", cantidad: 1, precioUnitarioCentavos: 69500, moneda: "USD" as const },
            { descripcion: "Kit de cableado y accesorios de red", cantidad: 1, precioUnitarioCentavos: 44500, moneda: "USD" as const },
          ],
        },
      ],
    },
    {
      id: "ejemplo-ceiba-pos",
      nombre: "Punto de venta",
      alternativas: [
        {
          id: "ejemplo-ceiba-pos-nacional",
          proveedor: "Caja Lista Atlántida (proveedor ficticio)",
          tipoCompra: "nacional" as const,
          elegida: false,
          notas: "Alternativa y cotización completamente ficticias en HNL.",
          items: [
            { descripcion: "Terminal táctil POS", cantidad: 2, precioUnitarioCentavos: 2875000, moneda: "HNL" as const },
            { descripcion: "Impresora térmica de recibos", cantidad: 2, precioUnitarioCentavos: 645000, moneda: "HNL" as const },
            { descripcion: "Lector de código de barras", cantidad: 1, precioUnitarioCentavos: 785000, moneda: "HNL" as const },
            { descripcion: "Instalación y capacitación", cantidad: 1, precioUnitarioCentavos: 1250000, moneda: "HNL" as const },
          ],
        },
        {
          id: "ejemplo-ceiba-pos-internacional",
          proveedor: "Tropic Point Systems (proveedor ficticio)",
          tipoCompra: "internacional" as const,
          elegida: true,
          notas: "Alternativa y cotización completamente ficticias en USD.",
          items: [
            { descripcion: "Terminal táctil POS", cantidad: 2, precioUnitarioCentavos: 119500, moneda: "USD" as const },
            { descripcion: "Impresora térmica de recibos", cantidad: 2, precioUnitarioCentavos: 24800, moneda: "USD" as const },
            { descripcion: "Cajón de dinero", cantidad: 2, precioUnitarioCentavos: 13900, moneda: "USD" as const },
          ],
        },
      ],
    },
    {
      id: "ejemplo-ceiba-seguridad",
      nombre: "Seguridad",
      alternativas: [
        {
          id: "ejemplo-ceiba-seguridad-nacional",
          proveedor: "Ojo del Puerto Seguridad (proveedor ficticio)",
          tipoCompra: "nacional" as const,
          elegida: true,
          notas: "Sistema, cotización y precios completamente ficticios en HNL.",
          items: [
            { descripcion: "Cámara IP interior PoE", cantidad: 6, precioUnitarioCentavos: 745000, moneda: "HNL" as const },
            { descripcion: "Cámara IP exterior resistente a intemperie", cantidad: 2, precioUnitarioCentavos: 985000, moneda: "HNL" as const },
            { descripcion: "Grabador NVR de 16 canales", cantidad: 1, precioUnitarioCentavos: 2480000, moneda: "HNL" as const },
            { descripcion: "Instalación y configuración del sistema", cantidad: 1, precioUnitarioCentavos: 1650000, moneda: "HNL" as const },
          ],
        },
        {
          id: "ejemplo-ceiba-seguridad-internacional",
          proveedor: "Blue Bay Surveillance (proveedor ficticio)",
          tipoCompra: "internacional" as const,
          elegida: false,
          notas: "Alternativa, sistema y cotización completamente ficticios en USD.",
          items: [
            { descripcion: "Cámara IP interior PoE", cantidad: 6, precioUnitarioCentavos: 28500, moneda: "USD" as const },
            { descripcion: "Cámara IP exterior resistente a intemperie", cantidad: 2, precioUnitarioCentavos: 38900, moneda: "USD" as const },
            { descripcion: "Grabador NVR de 16 canales", cantidad: 1, precioUnitarioCentavos: 104000, moneda: "USD" as const },
          ],
        },
      ],
    },
  ],
};
