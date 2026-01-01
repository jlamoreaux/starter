import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createAuth } from "~/lib/auth.server";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: async ({ request }) => {
    // Access D1 binding from request context
    // @ts-expect-error - D1 binding available at runtime
    const db = request.cf?.env?.DB;
    // @ts-expect-error - env available at runtime
    const env = request.cf?.env || process.env;

    if (!db) {
      return new Response("Database not available", { status: 500 });
    }

    const auth = createAuth(db, env);
    return auth.handler(request);
  },
  POST: async ({ request }) => {
    // @ts-expect-error - D1 binding available at runtime
    const db = request.cf?.env?.DB;
    // @ts-expect-error - env available at runtime
    const env = request.cf?.env || process.env;

    if (!db) {
      return new Response("Database not available", { status: 500 });
    }

    const auth = createAuth(db, env);
    return auth.handler(request);
  },
});
