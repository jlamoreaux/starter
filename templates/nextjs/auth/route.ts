// app/api/auth/[...all]/route.ts
import { createAuth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Runs on the Node.js runtime: OpenNext does not support `runtime = "edge"`.
async function handler(request: Request) {
  const { env } = getCloudflareContext();
  const auth = createAuth(env.DB);
  return auth.handler(request);
}

export { handler as GET, handler as POST };
