import { coins } from "./data/coins";
import CoinsTable from "./components/CoinsTable";
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

  const filteredCoins = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coins;

    return coins.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
      );
    });
  }, [search]);

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
          <div className="h-8 w-8 rounded-xl bg-amber-400" />
          <div className="font-semibold">Crypto Trading UI</div>

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

            <button className="rounded-xl border border-slate-800 px-3 py-2 text-sm hover:border-slate-700">
              Watchlist
            </button>
            <button className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-medium text-slate-950 hover:opacity-90">
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
          <Stat label="BTC" value="$43,120.55" hint="24h: +1.12%" />
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
            <CoinsTable coins={filteredCoins} />
          </div>

        </div>
      </main>
    </div>
  )
}