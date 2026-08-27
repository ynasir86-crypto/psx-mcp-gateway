import { validateAccessToken } from "../../../lib/oauth";

const secret = process.env.MCP_SECRET?.trim();

async function authorized(request: Request) {
  const auth = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");

  // Existing direct-secret authentication.
  if (
    secret &&
    (
      auth === `Bearer ${secret}` ||
      apiKey === secret
    )
  ) {
    return true;
  }

  // OAuth Bearer access token.
  if (
    auth &&
    auth.startsWith("Bearer ")
  ) {
    const token =
      auth.slice(7).trim();

    if (!token) {
      return false;
    }

    async function guarded(request: Request) {
  if (!secret) {
    return new Response(
      "MCP_SECRET is not configured",
      { status: 500 }
    );
  }

  if (!(await authorized(request))) {
    return new Response(
      "Unauthorized",
      {
        status: 401,
        headers: {
          "WWW-Authenticate":
            `Bearer resource_metadata="https://psx-mcp-gateway.vercel.app/.well-known/oauth-protected-resource"`,
        },
      }
    );
  }

  return mcpHandler(request);
    }

    const tokenData =
      await validateAccessToken(token);

    return Boolean(tokenData);
  }

  return false;
}
