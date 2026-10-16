import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
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
