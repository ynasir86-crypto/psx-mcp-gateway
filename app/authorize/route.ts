const allowedRedirectUri =
  process.env.OAUTH_REDIRECT_URI?.trim() ||
  OAUTH_REDIRECT_URI;

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
