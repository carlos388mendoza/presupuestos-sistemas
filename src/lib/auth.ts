import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

const https = (dominio?: string) => (dominio ? `https://${dominio}` : undefined);

// Dirección pública. En Vercel, si falta BETTER_AUTH_URL, se usa el dominio de producción.
const urlPublica = process.env.BETTER_AUTH_URL || https(process.env.VERCEL_PROJECT_PRODUCTION_URL);

// Orígenes desde los que se acepta iniciar sesión: la dirección pública y,
// en Vercel, la dirección propia de cada despliegue (vistas previas).
const origenesPermitidos = [
  urlPublica,
  https(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  https(process.env.VERCEL_BRANCH_URL),
  https(process.env.VERCEL_URL),
].filter((o): o is string => Boolean(o));

export const auth = betterAuth({
  baseURL: urlPublica,
  trustedOrigins: [...new Set(origenesPermitidos)],
  advanced: {
    // Cookies solo por HTTPS cuando la app está publicada.
    useSecureCookies: urlPublica?.startsWith("https://") ?? false,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // No hay registro público: los usuarios los crea un administrador.
    disableSignUp: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "creador", input: false },
      activo: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
  },
  databaseHooks: {
    session: {
      create: {
        // Bloquea el inicio de sesión de usuarios desactivados.
        before: async (s) => {
          const u = await db.query.user.findFirst({ where: eq(schema.user.id, s.userId) });
          if (!u || !u.activo) {
            throw new APIError("FORBIDDEN", { message: "Este usuario está desactivado." });
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});
