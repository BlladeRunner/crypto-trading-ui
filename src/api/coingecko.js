// src/api/coingecko.js
const BASE = "https://api.coingecko.com/api/v3";

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

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  return json.map((c) => ({
    id: c.id,
    name: c.name,
    symbol: c.symbol?.toUpperCase(),
    image: c.image,
    price: c.current_price ?? 0,
    change24h: c.price_change_percentage_24h ?? 0,
    marketCap: c.market_cap ?? 0,
    volume24h: c.total_volume ?? 0,
    sparkline: c.sparkline_in_7d?.price ?? [],
  }));
}