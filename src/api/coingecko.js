// src/api/coingecko.js
const BASE = "https://api.coingecko.com/api/v3";

async function safeFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Rate limit (429). Try again in ~30–60 seconds.");
    }
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Markets list (Top 100 / 101–200 / 201–300)
 */
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

/**
 * Market chart (used by CryptoCompare)
 * days: 7 | 30 | 90 | 365
 * returns: [{ t, v }]
 */
export async function fetchMarketChart({
  id,
  vsCurrency = "usd",
  days = 30,
} = {}) {
  if (!id) throw new Error("Missing coin id");

  const url = new URL(`${BASE}/coins/${encodeURIComponent(id)}/market_chart`);
  url.searchParams.set("vs_currency", vsCurrency);
  url.searchParams.set("days", String(days));
  url.searchParams.set("interval", days <= 30 ? "hourly" : "daily");

  const json = await safeFetch(url.toString());

  const prices = Array.isArray(json?.prices) ? json.prices : [];
  return prices.map(([t, v]) => ({ t, v }));
}