# PSX MCP Gateway

Remote MCP gateway for Pakistan Stock Exchange data, designed for Vercel/Next.js and ChatGPT-compatible MCP hosts.

## Tools
- get_quote
- get_market_snapshot
- get_market_watch
- get_symbols
- get_eod_history
- get_intraday
- get_announcements
- get_payouts

## Deploy
1. Push to GitHub.
2. Import into Vercel.
3. Set Node.js 20+.
4. Add `MCP_SECRET` as a long random secret.
5. Deploy.
6. Health: `https://YOUR-DOMAIN.vercel.app/api/health`
7. MCP endpoint: `https://YOUR-DOMAIN.vercel.app/api/mcp`

The current code expects the secret in `Authorization: Bearer <MCP_SECRET>` or `x-api-key`. If the ChatGPT app UI available to your account cannot supply a static API key, add an OAuth layer before exposing it.

## Local
`npm install`
`cp .env.example .env.local`
`npm run dev`

## Data
Uses public PSX Data Portal endpoints: `/market-watch`, `/symbols`, `/timeseries/eod/{SYMBOL}`, `/timeseries/int/{SYMBOL}`, `/announcements`, `/payouts`.

This is unofficial research infrastructure. Data can be delayed/inaccurate and is not investment advice. No broker or order execution is included.
