import { useMemo, useRef, useState, useEffect } from "react";

import CoinsTable from "./components/CoinsTable";
import useLocalStorage from "./hooks/useLocalStorage";
import { fetchMarkets } from "./api/coingecko";
import BlockViewLogo from "./components/BlockViewLogo";
import Footer from "./components/Footer";
import CryptoCompare from "./components/CryptoCompare";

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 font-mono text-lg text-slate-100">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

/**
 * SegmentedTabs
 * value: number
 * onChange: (next:number)=>void
 * items: [{ value:number, label:string }]
 */
function SegmentedTabs({ value, onChange, items }) {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/40 p-1">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "border border-amber-400/50 bg-amber-400/10 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.12)]"
                : "text-slate-300 hover:text-slate-100"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef(null);

  const [sort, setSort] = useState({ key: "marketCap", dir: "desc" });

  const [watchlistIds, setWatchlistIds] = useLocalStorage("watchlistIds", []);
  const [showWatchlist, setShowWatchlist] = useState(false);

  // Pages:
  // 1 => Top 100
  // 2 => 101–200
  // 3 => Crypto Compare
  const [page, setPage] = useState(1);

  // кеш по страницам
  const [coinsByPage, setCoinsByPage] = useState({ 1: [], 2: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- helpers
  function toggleWatchlist(id) {
    setWatchlistIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  // --- hotkey "/" focus search
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- fetch logic
  const shouldFetchPages = useMemo(() => {
    if (page === 3) return [1, 2];
    if (showWatchlist) return [1, 2];
    return page === 2 ? [2] : [1];
  }, [page, showWatchlist]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const pagesToFetch = shouldFetchPages;

        const tasks = pagesToFetch
          .filter((p) => !coinsByPage[p] || coinsByPage[p].length === 0)
          .map((p) => fetchMarkets({ page: p, perPage: 100 }));

        if (tasks.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }

        const results = await Promise.all(tasks);
        if (cancelled) return;

        setCoinsByPage((prev) => {
          const next = { ...prev };
          let idx = 0;
          for (const p of pagesToFetch) {
            if (!prev[p] || prev[p].length === 0) {
              next[p] = results[idx];
              idx += 1;
            }
          }
          return next;
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFetchPages]);

  // --- derive "coins" for current view
  const coinsForView = useMemo(() => {
    if (page === 1) return coinsByPage[1] || [];
    if (page === 2) return coinsByPage[2] || [];
    // page 3: сравнение — таблицу не показываем
    return [];
  }, [page, coinsByPage]);

  const btc = useMemo(() => {
    const a = coinsByPage[1] || [];
    const b = coinsByPage[2] || highlightEmpty([]);
    const found = [...a, ...b].find((c) => c.id === "bitcoin");
    return found || null;

    function highlightEmpty(x) {
      return x;
    }
  }, [coinsByPage]);

  const coinsListForCompare = useMemo(() => {
    const all = [...(coinsByPage[1] || []), ...(coinsByPage[2] || [])];
    return all.map(({ id, name, symbol }) => ({ id, name, symbol }));
  }, [coinsByPage]);

  // --- visible coins (filter + watchlist + sort)
  const visibleCoins = useMemo(() => {
    const q = search.trim().toLowerCase();

    const base = showWatchlist
      ? [...(coinsByPage[1] || []), ...(coinsByPage[2] || [])]
      : coinsForView;

    // 2) search
    const filtered = !q
      ? base
      : base.filter((c) => {
          return (
            c.name?.toLowerCase().includes(q) ||
            c.symbol?.toLowerCase().includes(q)
          );
        });

    // 3) watchlist filter (if enabled)
    const withWatchlistFilter = showWatchlist
      ? filtered.filter((c) => watchlistIds.includes(c.id))
      : filtered;

    // 4) sort
    const sorted = [...withWatchlistFilter].sort((a, b) => {
      const aVal = a?.[sort.key];
      const bVal = b?.[sort.key];

      if (aVal === bVal) return 0;

      const order = aVal > bVal ? 1 : -1;
      return sort.dir === "asc" ? order : -order;
    });

    return sorted;
  }, [search, showWatchlist, watchlistIds, sort, coinsForView, coinsByPage]);

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
              type="button"
              onClick={() => setShowWatchlist((v) => !v)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                showWatchlist
                  ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              Watchlist {watchlistIds.length ? `(${watchlistIds.length})` : ""}
            </button>

            <button
              type="button"
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
                active:scale-[0.98]
              "
            >
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
          <Stat
            label="BTC"
            value={btc ? `$${btc.price.toLocaleString()}` : "—"}
            hint={
              btc
                ? `24h: ${btc.change24h > 0 ? "+" : ""}${btc.change24h.toFixed(
                    2
                  )}%`
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

            <div className="ml-auto flex items-center gap-2">
              <SegmentedTabs
                value={page}
                onChange={setPage}
                items={[
                  { value: 3, label: "Crypto Compare" },
                  { value: 1, label: "Top 100" },
                  { value: 2, label: "101–200" },
                ]}
              />
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

            {!error && (
              <>
                {page === 3 ? (
                  <CryptoCompare coinsList={coinsListForCompare} />
                ) : (
                  <CoinsTable
                    coins={visibleCoins}
                    sort={sort}
                    onSortChange={setSort}
                    watchlistIds={watchlistIds}
                    onToggleWatchlist={toggleWatchlist}
                    loading={loading}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <Footer apiStatus="Live" lastUpdated="just now" />
      </main>
    </div>
  );
}