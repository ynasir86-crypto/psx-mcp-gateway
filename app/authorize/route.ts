import {
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  createAuthorizationCode,
} from "../../lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const responseType = url.searchParams.get("response_type");
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod =
    url.searchParams.get("code_challenge_method");
  const state = url.searchParams.get("state");

  const allowedRedirectUri =
    process.env.OAUTH_REDIRECT_URI?.trim() ||
    OAUTH_REDIRECT_URI;

  if (clientId !== OAUTH_CLIENT_ID) {
    return new Response("Invalid client_id", {
      status: 400,
    });
  }

  if (!redirectUri) {
    return new Response("Missing redirect_uri", {
      status: 400,
    });
  }

  if (redirectUri.trim() !== allowedRedirectUri) {
    return new Response(
      `Invalid redirect_uri. Received: ${redirectUri} Expected: ${allowedRedirectUri}`,
      { status: 400 }
    );
  }

  if (responseType !== "code") {
    return new Response(
      "Unsupported response_type",
      { status: 400 }
    );
  }

  if (
    !codeChallenge ||
    codeChallengeMethod !== "S256"
  ) {
    return new Response(
      "PKCE S256 is required",
      { status: 400 }
    );
  }

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>PSX MCP Authorization</title>
</head>
<body>
  <h2>PSX MCP Gateway</h2>
  <p>Enter the authorization password.</p>

  <form method="POST">
    <input
      type="password"
      name="password"
      placeholder="Password"
      required
    />

    <input type="hidden" name="client_id"
      value="${escapeHtml(clientId || "")}" />

    <input type="hidden" name="redirect_uri"
      value="${escapeHtml(redirectUri)}" />

    <input type="hidden" name="code_challenge"
      value="${escapeHtml(codeChallenge || "")}" />

    <input type="hidden" name="state"
      value="${escapeHtml(state || "")}" />

    <button type="submit">Authorize</button>
  </form>
</body>
</html>
`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export async function POST(request: Request) {
  const form = await request.formData();

  const password =
    form.get("password")?.toString() || "";

  const clientId =
    form.get("client_id")?.toString() || "";

  const redirectUri =
    form.get("redirect_uri")?.toString() || "";

  const codeChallenge =
    form.get("code_challenge")?.toString() || "";

  const state =
    form.get("state")?.toString() || "";

  const allowedRedirectUri =
    process.env.OAUTH_REDIRECT_URI?.trim() ||
    OAUTH_REDIRECT_URI;

  if (clientId !== OAUTH_CLIENT_ID) {
    return new Response("Invalid client_id", {
      status: 400,
    });
  }

  if (
    !redirectUri ||
    redirectUri.trim() !== allowedRedirectUri
  ) {
    return new Response("Invalid redirect_uri", {
      status: 400,
    });
  }

  if (
    password !==
    process.env.OAUTH_ADMIN_PASSWORD
  ) {
    return new Response(
      "Invalid authorization password",
      { status: 401 }
    );
  }

  const code = await createAuthorizationCode({
    clientId,
    redirectUri,
    codeChallenge,
  });

  const callback = new URL(redirectUri);

  callback.searchParams.set("code", code);

  if (state) {
    callback.searchParams.set("state", state);
  }

  return Response.redirect(
    callback.toString(),
    302
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
      }
