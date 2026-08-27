import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  announcements,
  eod,
  intraday,
  marketSnapshot,
  marketWatch,
  payouts,
  quote,
  symbols,
} from "../../../lib/psx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const secret = process.env.MCP_SECRET?.trim();

function authorized(request: Request) {
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");

  return (
    auth === `Bearer ${secret}` ||
    apiKey === secret
  );
}

const mcpHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      "get_quote",
      {
        title: "PSX Quote",
        description:
          "Get the current PSX quote for a symbol.",
        inputSchema: z.object({
          symbol: z.string().min(1).max(20),
        }),
      },
      async ({ symbol }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await quote(symbol),
              null,
              2
            ),
          },
        ],
      })
    );

    server.registerTool(
      "get_market_snapshot",
      {
        title: "PSX Market Snapshot",
        description:
          "Get PSX market breadth, top gainers, top losers and highest-volume stocks.",
        inputSchema: z.object({
          limit: z
            .number()
            .int()
            .min(1)
            .max(25)
            .default(10),
        }),
      },
      async ({ limit }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await marketSnapshot(limit),
              null,
              2
            ),
          },
        ],
      })
    );

    server.registerTool(
      "get_market_watch",
      {
        title: "PSX Market Watch",
        description:
          "Get current PSX market-watch data.",
        inputSchema: z.object({}),
      },
      async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await marketWatch(),
              null,
              2
            ),
          },
        ],
      })
    );

    server.registerTool(
      "get_symbols",
      {
        title: "PSX Symbols",
        description:
          "Get the PSX symbol directory.",
        inputSchema: z.object({}),
      },
      async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await symbols(),
              null,
              2
            ),
          },
        ],
      })
    );

    server.registerTool(
      "get_eod_history",
      {
        title: "PSX EOD History",
        description:
          "Get historical end-of-day data for a PSX symbol.",
        inputSchema: z.object({
          symbol: z.string().min(1).max(20),
        }),
      },
      async ({ symbol }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await eod(symbol),
              null,
              2
            ),
          },
        ],
      })
    );

    server.registerTool(
      "get_intraday",
      {
        title: "PSX Intraday",
        description:
          "Get intraday data for a PSX symbol.",
        inputSchema: z.object({
          symbol: z.string().min(1).max(20),
        }),
      },
      async ({ symbol }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await intraday(symbol),
              null,
              2
            ),
          },
        ],
      })
    );

    server.registerTool(
      "get_announcements",
      {
        title: "PSX Announcements",
        description:
          "Get recent PSX company announcements.",
        inputSchema: z.object({
          symbol: z
            .string()
            .min(1)
            .max(20)
            .optional(),

          limit: z
            .number()
            .int()
            .min(1)
            .max(50)
            .default(10),
        }),
      },
      async ({ symbol, limit }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await announcements(
                symbol,
                limit
              ),
              null,
              2
            ),
          },
        ],
      })
    );

    server.registerTool(
      "get_payouts",
      {
        title: "PSX Payouts",
        description:
          "Get recent dividend/payout information.",
        inputSchema: z.object({
          symbol: z
            .string()
            .min(1)
            .max(20)
            .optional(),

          limit: z
            .number()
            .int()
            .min(1)
            .max(50)
            .default(10),
        }),
      },
      async ({ symbol, limit }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              await payouts(
                symbol,
                limit
              ),
              null,
              2
            ),
          },
        ],
      })
    );
  },
  {
    serverInfo: {
      name: "PSX Trading Gateway",
      version: "1.0.0",
    },
  }
);

async function guarded(request: Request) {
  if (!secret) {
    return new Response(
      "MCP_SECRET is not configured",
      { status: 500 }
    );
  }

  if (!authorized(request)) {
    return new Response(
      "Unauthorized",
      { status: 401 }
    );
  }

  return mcpHandler(request);
}

export const GET = guarded;
export const POST = guarded;
export const DELETE = guarded;
