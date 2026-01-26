import { useMemo, useRef, useState, useEffect } from "react";

import CoinsTable from "./components/CoinsTable";
import useLocalStorage from "./hooks/useLocalStorage";
import { fetchMarkets } from "./api/coingecko";
import BlockViewLogo from "./components/BlockViewLogo";
import Footer from "./components/Footer";
import CryptoCompare from "./components/CryptoCompare";
import ExitPoints from "./components/ExitPoints";

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

// --- fixed view ids
const VIEW_TOP_100 = 1;
const VIEW_101_200 = 2;
const VIEW_201_300 = 3;
const VIEW_COMPARE = 4;
const VIEW_EXIT_POINTS = 5;

export default function App() {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef(null);

  const [sort, setSort] = useState({ key: "marketCap", dir: "desc" });

  const [watchlistIds, setWatchlistIds] = useLocalStorage("watchlistIds", []);
  const [showWatchlist, setShowWatchlist] = useState(false);

  // current view tab
  const [page, setPage] = useState(VIEW_TOP_100);

  // market pages cache
  const [coinsByPage, setCoinsByPage] = useState({
    [VIEW_TOP_100]: [],
    [VIEW_101_200]: [],
    [VIEW_201_300]: [],
  });

  // BTC for stats
  const [btcCoin, setBtcCoin] = useState(null);

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

  // --- which pages should be fetched now
  const shouldFetchPages = useMemo(() => {
    // if watchlist enabled — ensure all coin pages are loaded
    if (showWatchlist) return [VIEW_TOP_100, VIEW_101_200, VIEW_201_300];

    // only fetch when we are on coin pages; Compare/Exit don't need markets fetch
    if ([VIEW_TOP_100, VIEW_101_200, VIEW_201_300].includes(page)) return [page];

    return [];
  }, [page, showWatchlist]);

  // --- fetch markets (Top100 / 101-200 / 201-300)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const pagesToFetch = shouldFetchPages;
      if (pagesToFetch.length === 0) return;

      try {
        setLoading(true);
        setError("");

        // fetch only missing pages
        const missing = pagesToFetch.filter(
          (p) => !coinsByPage[p] || coinsByPage[p].length === 0
        );

        if (missing.length === 0) {
          // already in cache
          return;
        }

        const results = await Promise.all(
          missing.map((p) => fetchMarkets({ page: p, perPage: 100 }))
        );

        if (cancelled) return;

        setCoinsByPage((prev) => {
          const next = { ...prev };
          missing.forEach((p, i) => {
            next[p] = results[i];
          });

          // update BTC stats from all loaded pages
          const all = [
            ...(next[VIEW_TOP_100] || []),
            ...(next[VIEW_101_200] || []),
            ...(next[VIEW_201_300] || []),
          ];
          const foundBtc = all.find((c) => c.id === "bitcoin") || null;
          setBtcCoin(foundBtc);

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

  // --- coins for current coin-page view
  const coinsForView = useMemo(() => {
    if (page === VIEW_TOP_100) return coinsByPage[VIEW_TOP_100] || [];
    if (page === VIEW_101_200) return coinsByPage[VIEW_101_200] || [];
    if (page === VIEW_201_300) return coinsByPage[VIEW_201_300] || [];
    return [];
  }, [page, coinsByPage]);

  // --- list for Compare/Exit (all loaded pages)
  const coinsListForTools = useMemo(() => {
    const all = [
      ...(coinsByPage[VIEW_TOP_100] || []),
      ...(coinsByPage[VIEW_101_200] || []),
      ...(coinsByPage[VIEW_201_300] || []),
    ];
    return all.map(({ id, name, symbol }) => ({ id, name, symbol }));
  }, [coinsByPage]);

  // --- visible coins (filter + watchlist + sort)
  const visibleCoins = useMemo(() => {
    const q = search.trim().toLowerCase();

    // base set
    const base = showWatchlist
      ? [
          ...(coinsByPage[VIEW_TOP_100] || []),
          ...(coinsByPage[VIEW_101_200] || []),
          ...(coinsByPage[VIEW_201_300] || []),
        ]
      : coinsForView;

    // search
    const filtered = !q
      ? base
      : base.filter((c) => {
          return (
            c.name?.toLowerCase().includes(q) ||
            c.symbol?.toLowerCase().includes(q)
          );
        });

    // watchlist filter
    const withWatchlistFilter = showWatchlist
      ? filtered.filter((c) => watchlistIds.includes(c.id))
      : filtered;

    // sort
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

            {/* Watchlist */}
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
            value={btcCoin ? `$${btcCoin.price.toLocaleString()}` : "—"}
            hint={
              btcCoin
                ? `24h: ${btcCoin.change24h > 0 ? "+" : ""}${btcCoin.change24h.toFixed(
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
                  { value: VIEW_COMPARE, label: "Crypto Compare" },
                  { value: VIEW_EXIT_POINTS, label: "Exit Points" },
                  { value: VIEW_TOP_100, label: "Top 100" },
                  { value: VIEW_101_200, label: "101–200" },
                  { value: VIEW_201_300, label: "201–300" },
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
                {page === VIEW_COMPARE ? (
                  <CryptoCompare coinsList={coinsListForTools} />
                ) : page === VIEW_EXIT_POINTS ? (
                  <ExitPoints coinsList={coinsListForTools} />
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