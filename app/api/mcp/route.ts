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

    const tokenData =
      await validateAccessToken(token);

    return Boolean(tokenData);
  }

  return false;
}
