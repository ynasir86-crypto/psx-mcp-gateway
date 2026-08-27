import {
  OAUTH_ISSUER,
  OAUTH_CLIENT_ID,
} from "../../../../lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    issuer: OAUTH_ISSUER,

    authorization_endpoint:
      `${OAUTH_ISSUER}/authorize`,

    token_endpoint:
      `${OAUTH_ISSUER}/token`,

    response_types_supported: [
      "code",
    ],

    grant_types_supported: [
      "authorization_code",
    ],

    code_challenge_methods_supported: [
      "S256",
    ],

    token_endpoint_auth_methods_supported: [
      "none",
    ],

    scopes_supported: [
      "mcp",
    ],

    client_id: OAUTH_CLIENT_ID,
  });
}
