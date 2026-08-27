const BASE = "https://dps.psx.com.pk";

const timeoutMs = Number(process.env.PSX_TIMEOUT_MS || 15000);

function headers() {
  return {
    "User-Agent":
      process.env.PSX_MCP_USER_AGENT ||
      "PSX-MCP-Gateway/1.0",
    Accept: "application/json,text/plain,*/*",
  };
}

async function psxFetch(
  path: string,
  init: RequestInit = {}
) {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...headers(),
        ...(init.headers || {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(
        `PSX returned HTTP ${res.status}: ${text.slice(0, 300)}`
      );
    }

    return text;
  } finally {
    clearTimeout(timer);
  }
}

function cleanNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const n = Number(
    String(value)
      .replace(/,/g, "")
      .replace(/%/g, "")
  );

  return Number.isFinite(n) ? n : null;
}

function normalizeRows(payload: any): any[] {
  if (Array.isArray(payload)) return payload;

  for (const key of [
    "data",
    "rows",
    "result",
    "results",
    "companies",
    "records",
  ]) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
}

function normalizeMarketRow(row: any): any {
  if (Array.isArray(row)) {
    return {
      symbol: row[0],
      sector: row[1],
      listedIn: row[2],
      ldcp: cleanNumber(row[3]),
      open: cleanNumber(row[4]),
      high: cleanNumber(row[5]),
      low: cleanNumber(row[6]),
      current: cleanNumber(row[7]),
      change: cleanNumber(row[8]),
      changePct: cleanNumber(row[9]),
      volume: cleanNumber(row[10]),
    };
  }

  return {
    symbol: row.SYMBOL ?? row.symbol,
    name: row.NAME ?? row.name ?? row["COMPANY NAME"],
    sector: row.SECTOR ?? row.sector ?? row.sectorName,
    listedIn: row["LISTED IN"] ?? row.LISTED_IN ?? row.listedIn,
    ldcp: cleanNumber(row.LDCP ?? row.ldcp),
    open: cleanNumber(row.OPEN ?? row.open),
    high: cleanNumber(row.HIGH ?? row.high),
    low: cleanNumber(row.LOW ?? row.low),
    current: cleanNumber(
      row.CURRENT ?? row.current ?? row.price
    ),
    change: cleanNumber(row.CHANGE ?? row.change),
    changePct: cleanNumber(
      row["CHANGE (%)"] ??
        row.CHANGE_PCT ??
        row.changePct
    ),
    volume: cleanNumber(row.VOLUME ?? row.volume),
  };
}

export async function marketWatch() {
  const text = await psxFetch("/market-watch");

  let payload: any;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      "PSX /market-watch did not return JSON. The public portal format may have changed."
    );
  }

  const rows = normalizeRows(payload)
    .map(normalizeMarketRow)
    .filter((r) => r.symbol);

  return {
    source: `${BASE}/market-watch`,
    fetchedAt: new Date().toISOString(),
    count: rows.length,
    data: rows,
  };
}

export async function symbols() {
  const text = await psxFetch("/symbols");

  let payload: any;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("PSX /symbols did not return JSON.");
  }

  const rows = normalizeRows(payload);

  return {
    source: `${BASE}/symbols`,
    fetchedAt: new Date().toISOString(),
    count: rows.length,
    data: rows,
  };
}

export async function quote(symbol: string) {
  const s = symbol.trim().toUpperCase();

  const market = await marketWatch();

  const row = market.data.find(
    (r) => String(r.symbol).toUpperCase() === s
  );

  if (!row) {
    throw new Error(
      `Symbol ${s} was not found in the PSX market-watch universe.`
    );
  }

  return {
    ...row,
    source: market.source,
    fetchedAt: market.fetchedAt,
  };
}

export async function eod(symbol: string) {
  const s = symbol.trim().toUpperCase();

  const text = await psxFetch(
    `/timeseries/eod/${encodeURIComponent(s)}`
  );

  let payload: any;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      `PSX EOD endpoint for ${s} did not return JSON.`
    );
  }

  const rows = normalizeRows(payload).map((r: any) => {
    if (Array.isArray(r)) {
      return {
        timestamp: r[0],
        close: cleanNumber(r[1]),
        volume: cleanNumber(r[2]),
        open: cleanNumber(r[3]),
        high: cleanNumber(r[4]),
        low: cleanNumber(r[5]),
      };
    }

    return r;
  });

  return {
    symbol: s,
    source: `${BASE}/timeseries/eod/${s}`,
    fetchedAt: new Date().toISOString(),
    data: rows,
  };
}

export async function intraday(symbol: string) {
  const s = symbol.trim().toUpperCase();

  const text = await psxFetch(
    `/timeseries/int/${encodeURIComponent(s)}`
  );

  let payload: any;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      `PSX intraday endpoint for ${s} did not return JSON.`
    );
  }

  return {
    symbol: s,
    source: `${BASE}/timeseries/int/${s}`,
    fetchedAt: new Date().toISOString(),
    data: normalizeRows(payload),
  };
}

export async function announcements(
  symbol?: string,
  limit = 10
) {
  const body = new URLSearchParams();

  body.set("type", "C");
  body.set("page", "1");

  if (symbol) {
    body.set("symbol", symbol.trim().toUpperCase());
  }

  const text = await psxFetch("/announcements", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  let payload: any;

  try {
    payload = JSON.parse(text);
  } catch {
    return {
      source: `${BASE}/announcements`,
      fetchedAt: new Date().toISOString(),
      warning:
        "PSX announcements endpoint returned a non-JSON response.",
      rawPreview: text.slice(0, 1000),
    };
  }

  return {
    source: `${BASE}/announcements`,
    fetchedAt: new Date().toISOString(),
    data: normalizeRows(payload).slice(
      0,
      Math.max(1, Math.min(limit, 50))
    ),
  };
}

export async function payouts(
  symbol?: string,
  limit = 10
) {
  const body = new URLSearchParams();

  body.set("page", "1");

  if (symbol) {
    body.set("symbol", symbol.trim().toUpperCase());
  }

  const text = await psxFetch("/payouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  let payload: any;

  try {
    payload = JSON.parse(text);
  } catch {
    return {
      source: `${BASE}/payouts`,
      fetchedAt: new Date().toISOString(),
      warning:
        "PSX payouts endpoint returned a non-JSON response.",
      rawPreview: text.slice(0, 1000),
    };
  }

  return {
    source: `${BASE}/payouts`,
    fetchedAt: new Date().toISOString(),
    data: normalizeRows(payload).slice(
      0,
      Math.max(1, Math.min(limit, 50))
    ),
  };
}

export async function marketSnapshot(limit = 10) {
  const market = await marketWatch();

  const valid = market.data.filter(
    (r) => typeof r.changePct === "number"
  );

  const gainers = [...valid]
    .sort(
      (a, b) =>
        (b.changePct ?? -999) -
        (a.changePct ?? -999)
    )
    .slice(0, limit);

  const losers = [...valid]
    .sort(
      (a, b) =>
        (a.changePct ?? 999) -
        (b.changePct ?? 999)
    )
    .slice(0, limit);

  const volume = [...market.data]
    .sort(
      (a, b) =>
        (b.volume ?? -1) -
        (a.volume ?? -1)
    )
    .slice(0, limit);

  const advancers = valid.filter(
    (r) => (r.changePct ?? 0) > 0
  ).length;

  const decliners = valid.filter(
    (r) => (r.changePct ?? 0) < 0
  ).length;

  const unchanged = valid.filter(
    (r) => (r.changePct ?? 0) === 0
  ).length;

  return {
    fetchedAt: market.fetchedAt,
    universeCount: market.count,
    breadth: {
      advancers,
      decliners,
      unchanged,
    },
    topGainers: gainers,
    topLosers: losers,
    topVolume: volume,
    source: market.source,
  };
}
