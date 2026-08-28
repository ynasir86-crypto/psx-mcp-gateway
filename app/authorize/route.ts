import {
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  createAuthorizationCode,
} from "../../lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const responseType = url.searchParams.get("response_type");
    const clientId = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
    const scope = url.searchParams.get("scope");
    const state = url.searchParams.get("state");
    const codeChallenge = url.searchParams.get("code_challenge");
    const codeChallengeMethod = url.searchParams.get(
      "code_challenge_method"
    );

    // Validate required OAuth parameters
    if (responseType !== "code") {
      return new Response("Unsupported response_type", {
        status: 400,
      });
    }

    if (!clientId) {
      return new Response("Missing client_id", {
        status: 400,
      });
    }

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

    if (redirectUri !== OAUTH_REDIRECT_URI) {
      return new Response(
        `Invalid redirect_uri. Received: ${redirectUri} Expected: ${OAUTH_REDIRECT_URI}`,
        {
          status: 400,
        }
      );
    }

    if (!codeChallenge) {
      return new Response("Missing code_challenge", {
        status: 400,
      });
    }

    if (codeChallengeMethod !== "S256") {
      return new Response(
        "Unsupported code_challenge_method",
        {
          status: 400,
        }
      );
    }

    // Create the authorization code BEFORE using it.
    const code = await createAuthorizationCode({
      clientId,
      redirectUri,
      codeChallenge,
    });

    // Redirect back to ChatGPT with the authorization code.
    const callback = new URL(redirectUri);

    callback.searchParams.set("code", code);

    if (state) {
      callback.searchParams.set("state", state);
    }

    return Response.redirect(callback.toString(), 302);
  } catch (error) {
    console.error("OAuth authorize error:", error);

    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}
