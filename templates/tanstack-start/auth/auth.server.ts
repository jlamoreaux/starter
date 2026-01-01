import type { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// Create auth instance with D1 database binding
export function createAuth(db: D1Database, env: Record<string, string>) {
  const drizzleDb = drizzle(db, { schema });

  return betterAuth({
    database: drizzleAdapter(drizzleDb, {
      provider: "sqlite",
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
    },
    // Uncomment to enable OAuth providers
    // socialProviders: {
    //   github: {
    //     clientId: env.GITHUB_CLIENT_ID,
    //     clientSecret: env.GITHUB_CLIENT_SECRET,
    //   },
    //   google: {
    //     clientId: env.GOOGLE_CLIENT_ID,
    //     clientSecret: env.GOOGLE_CLIENT_SECRET,
    //   },
    // },
  });
}

// Type helper for auth instance
export type Auth = ReturnType<typeof createAuth>;
