const BASE_URL = "/api/coingecko/api/v3";

export async function fetchMarkets() {
  const params = new URLSearchParams({
    vs_currency: import.meta.env.VITE_VS_CURRENCY || "usd",
    order: "market_cap_desc",
    per_page: "50",
    page: "1",
    sparkline: "false",
    price_change_percentage: "24h",
  });

  const res = await fetch(`${BASE_URL}/coins/markets?${params.toString()}`);

  if (!res.ok) throw new Error("CoinGecko request failed");
  const data = await res.json();

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    symbol: c.symbol?.toUpperCase() ?? "",
    image: c.image,
    price: c.current_price,
    change24h: c.price_change_percentage_24h,
    marketCap: c.market_cap,
    volume24h: c.total_volume,
  }));
}