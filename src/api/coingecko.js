// src/api/coingecko.js
const BASE = "https://api.coingecko.com/api/v3";

/* ----------------------------------------
   Safe fetch with basic rate-limit handling
----------------------------------------- */
async function safeFetch(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Rate limit (429). Try again in ~30–60 seconds.");
    }
    if (res.status === 401) {
      throw new Error("Unauthorized (401). CoinGecko blocked the request.");
    }
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

/* ----------------------------------------
   Markets list (Top 100 / 200 / 300)
----------------------------------------- */
export async function fetchMarkets({
  vsCurrency = "usd",
  perPage = 100,
  page = 1,
} = {}) {
  const url = new URL(`${BASE}/coins/markets`);

  url.searchParams.set("vs_currency", vsCurrency);
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("sparkline", "true");
  url.searchParams.set("price_change_percentage", "24h");

  const json = await safeFetch(url.toString());

  return json.map((c) => ({
    id: c.id,
    name: c.name,
    symbol: (c.symbol || "").toUpperCase(),
    image: c.image,
    price: c.current_price ?? 0,
    change24h: c.price_change_percentage_24h ?? 0,
    marketCap: c.market_cap ?? 0,
    volume24h: c.total_volume ?? 0,
    sparkline: c.sparkline_in_7d?.price ?? [],
  }));
}

/* ----------------------------------------
   Market chart for Crypto Compare
   returns: [{ t, v }]
----------------------------------------- */
export async function fetchMarketChart({
  id,
  vsCurrency = "usd",
  days = 30,
} = {}) {
  if (!id) throw new Error("Missing coin id");

  const url = new URL(`${BASE}/coins/${encodeURIComponent(id)}/market_chart`);

  url.searchParams.set("vs_currency", vsCurrency);
  url.searchParams.set("days", String(days));

  // IMPORTANT:
  // hourly often triggers rate limits → use daily always
  url.searchParams.set("interval", "daily");

  const json = await safeFetch(url.toString());

  const prices = Array.isArray(json?.prices) ? json.prices : [];

  return prices
    .filter((p) => Array.isArray(p) && p.length >= 2)
    .map(([t, v]) => ({ t, v }));
}