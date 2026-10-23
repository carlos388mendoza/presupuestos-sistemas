import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Presupuestos · Sistemas",
  description: "Presupuestos del departamento de Sistemas para aperturas y remodelaciones de restaurantes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: el script de abajo agrega la clase "dark" antes de que cargue React.
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Aplica el tema guardado (o el del sistema) antes de pintar, en todas las páginas
            incluido el login, para evitar el parpadeo claro. Misma lógica que src/lib/tema.ts. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("tema");var o=t==="oscuro"||((t!=="claro")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",o)}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
