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
} from "../../../../lib/psx";

export const GET = guarded;
export const POST = guarded;
export const DELETE = guarded;
