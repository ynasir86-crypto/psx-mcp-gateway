import { MCP_RESOURCE } from "../../../lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    resource: MCP_RESOURCE,
    authorization_servers: [
      process.env.OAUTH_ISSUER ||
        "https://psx-mcp-gateway.vercel.app",
    ],
  });
}
