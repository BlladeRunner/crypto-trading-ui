import CoinsTable from "./components/CoinsTable";
import useLocalStorage from "./hooks/useLocalStorage";
import { fetchMarkets } from "./api/coingecko";
import BlockViewLogo from "./components/BlockViewLogo";
import Footer from "./components/Footer";
import { useMemo, useRef, useState, useEffect } from "react";


function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 font-mono text-lg text-slate-100">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef(null);
  const [sort, setSort] = useState({ key: "marketCap", dir: "desc" });
  const [watchlistIds, setWatchlistIds] = useLocalStorage("watchlistIds", []);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function toggleWatchlist(id) {
    setWatchlistIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchMarkets();
        if (mounted) setCoins(data);
      } catch (e) {
        if (mounted) setError(e.message || "Fetch failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const btc = useMemo(
    () => coins.find((c) => c.id === "bitcoin"),
    [coins]
  );

  const visibleCoins = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = !q
      ? coins
      : coins.filter((c) => {
          return (
            c.name.toLowerCase().includes(q) ||
            c.symbol.toLowerCase().includes(q)
          );
      });

    const withWatchlistFilter = showWatchlist
      ? filtered.filter((c) => watchlistIds.includes(c.id))
      : filtered;  

    const sorted = [...withWatchlistFilter].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];

      if (aVal === bVal) return 0;

      const order = aVal > bVal ? 1 : -1;
      return sort.dir === "asc" ? order : -order;
    });

    return sorted;
  }, [search, sort, showWatchlist, watchlistIds, coins]);


  useEffect(() => {
  function handleKeyDown(e) {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.key === "/") {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <BlockViewLogo size={65} />

            <div className="leading-tight">
              <div className="font-semibold text-lg">BlockView</div>
              <div className="text-xs text-slate-400">CoinScope</div>
            </div>
          </div>
          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block">
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search coin… ( / )"
                className="w-64 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-amber-400"
              />    
            </div>

            <button 
              onClick={() => setShowWatchlist((v) => !v)}
              className={`rounded-xl border px-3 py-2 text-sm ${
                showWatchlist
                ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
                : "border-slate-800 hover:border-slate-700"
              } font-medium`}>
              Watchlist {watchlistIds.length ? `(${watchlistIds.length})` : ""}
            </button>
            <button 
              className="
                px-4 py-2
                rounded-xl
                font-medium
              text-slate-900
              bg-orange-500
                shadow-[0_0_18px_rgba(251,146,60,0.45)]
                ring-1 ring-amber-300/30
                transition
              hover:bg-orange-400
                hover:shadow-[0_0_22px_rgba(251,146,60,0.6)]
                active:scale-[0.98]">
              Connect
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Stats row */}
        <div className="grid gap-3 md:grid-cols-3">
          <Stat label="Market" value="Risk-On" hint="Demo UI (no API yet)" />
          <Stat label="Top Gainer (24h)" value="+8.42%" hint="SOL (mock)" />
          <Stat label="BTC"   value={btc ? `$${btc.price.toLocaleString()}` : "—"}
              hint={
                btc
                  ? `24h: ${btc.change24h > 0 ? "+" : ""}${btc.change24h.toFixed(2)}%`
                  : "—"
              } 
          />
        </div>

        {/* Screener card */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <span className="text-sm font-semibold">Screener</span>
            <span className="rounded-full border border-slate-800 px-2 py-1 text-xs text-slate-400">
              UI only
            </span>

            <div className="ml-auto flex gap-2">
              <button className="rounded-full border border-slate-800 px-3 py-1.5 text-xs hover:border-slate-700">
                Top 100
              </button>
              <button className="rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200">
                Gainers
              </button>
              <button className="rounded-full border border-slate-800 px-3 py-1.5 text-xs hover:border-slate-700">
                Losers
              </button>
            </div>
          </div>

          <div className="p-4">
            {loading && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-400">
                Loading market data…
              </div>
            )}

            {error && !loading && (
              <div className="rounded-2xl border border-rose-900/40 bg-rose-950/30 p-4 text-sm text-rose-200">
                {error}
              </div>
            )}

            {!loading && !error && (
              <CoinsTable
                coins={visibleCoins}
                sort={sort}
                onSortChange={setSort}
                watchlistIds={watchlistIds}
                onToggleWatchlist={toggleWatchlist}
                loading={loading} 
              />
            )}
          </div>

        </div>
        <Footer apiStatus="Live" lastUpdated="just now" />
      </main>
    </div>
  )
}