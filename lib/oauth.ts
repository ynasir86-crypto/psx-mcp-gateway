import { Redis } from "@upstash/redis";
import { createHash, randomBytes } from "crypto";

const redis = Redis.fromEnv();

export const OAUTH_ISSUER =
  process.env.OAUTH_ISSUER ||
  "https://psx-mcp-gateway.vercel.app";

export const MCP_RESOURCE =
  process.env.MCP_RESOURCE ||
  "https://psx-mcp-gateway.vercel.app/api/mcp";

export const OAUTH_CLIENT_ID =
  process.env.OAUTH_CLIENT_ID || "chatgpt";

export const OAUTH_REDIRECT_URI =
  process.env.OAUTH_REDIRECT_URI ||
  "https://chatgpt.com/connector/oauth/LR_MU6x5A9sp";

const AUTH_CODE_TTL = 300;
const ACCESS_TOKEN_TTL = 3600;

function base64url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function randomToken(bytes = 32): string {
  return base64url(randomBytes(bytes));
}

export function sha256Base64Url(value: string): string {
  return base64url(
    createHash("sha256")
      .update(value)
      .digest()
  );
}

export function verifyPkce(
  codeVerifier: string,
  codeChallenge: string
): boolean {
  return sha256Base64Url(codeVerifier) === codeChallenge;
}

export async function createAuthorizationCode(data: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
}) {
  const code = randomToken(32);

  await redis.set(
    `oauth:code:${code}`,
    {
      ...data,
      createdAt: Date.now(),
    },
    {
      ex: AUTH_CODE_TTL,
    }
  );

  return code;
}

export async function consumeAuthorizationCode(code: string) {
  const key = `oauth:code:${code}`;

  const data = await redis.get<{
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    createdAt: number;
  }>(key);

  if (!data) {
    return null;
  }

  await redis.del(key);

  return data;
}

export async function createAccessToken(clientId: string) {
  const token = randomToken(48);

  await redis.set(
    `oauth:token:${token}`,
    {
      clientId,
      createdAt: Date.now(),
    },
    {
      ex: ACCESS_TOKEN_TTL,
    }
  );

  return token;
}

export async function validateAccessToken(token: string) {
  return await redis.get<{
    clientId: string;
    createdAt: number;
  }>(`oauth:token:${token}`);
}
