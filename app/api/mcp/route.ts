
export async function GET() {
  return Response.json({
    ok: true,
    service: "psx-mcp-gateway",
    version: "1.0.0",
    time: new Date().toISOString(),
  });
}
