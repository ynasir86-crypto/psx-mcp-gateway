import {
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  consumeAuthorizationCode,
  createAccessToken,
  verifyPkce,
} from "../../lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const contentType =
    request.headers.get("content-type") || "";

  let body: Record<string, string> = {};

  if (
    contentType.includes(
      "application/x-www-form-urlencoded"
    )
  ) {
    const form = await request.formData();

    for (const [key, value] of form.entries()) {
      body[key] = value.toString();
    }
  } else {
    body = await request.json();
  }

  const grantType = body.grant_type;
  const code = body.code;
  const clientId = body.client_id;
  const redirectUri = body.redirect_uri;
  const codeVerifier = body.code_verifier;

  if (
    grantType !==
    "authorization_code"
  ) {
    return Response.json(
      {
        error:
          "unsupported_grant_type",
      },
      { status: 400 }
    );
  }

  if (
    clientId !== OAUTH_CLIENT_ID
  ) {
    return Response.json(
      {
        error:
          "invalid_client",
      },
      { status: 401 }
    );
  }

  if (
    redirectUri !==
    OAUTH_REDIRECT_URI
  ) {
    return Response.json(
      {
        error:
          "invalid_grant",
      },
      { status: 400 }
    );
  }

  if (
    !code ||
    !codeVerifier
  ) {
    return Response.json(
      {
        error:
          "invalid_request",
      },
      { status: 400 }
    );
  }

  const authorizationCode =
    await consumeAuthorizationCode(
      code
    );

  if (!authorizationCode) {
    return Response.json(
      {
        error:
          "invalid_grant",
      },
      { status: 400 }
    );
  }

  if (
    authorizationCode.clientId !==
    clientId
  ) {
    return Response.json(
      {
        error:
          "invalid_grant",
      },
      { status: 400 }
    );
  }

  if (
    authorizationCode.redirectUri !==
    redirectUri
  ) {
    return Response.json(
      {
        error:
          "invalid_grant",
      },
      { status: 400 }
    );
  }

  if (
    !verifyPkce(
      codeVerifier,
      authorizationCode.codeChallenge
    )
  ) {
    return Response.json(
      {
        error:
          "invalid_grant",
      },
      { status: 400 }
    );
  }

  const accessToken =
    await createAccessToken(
      clientId
    );

  return Response.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
  });
}
