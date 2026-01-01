// app/api/auth/[...all]/route.ts
import { createAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

async function handler(request: Request) {
  const { env } = getRequestContext();
  const auth = createAuth(env.DB);
  return auth.handler(request);
}

export { handler as GET, handler as POST };
