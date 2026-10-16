import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Revisión rápida (solo existencia de cookie). La validación real de la
// sesión y de permisos se hace en el servidor en cada página y acción.
export function proxy(request: NextRequest) {
  const cookie = getSessionCookie(request);
  if (!cookie) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|login|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo-grupo-comidas[^/]*\\.png).*)",
  ],
};
