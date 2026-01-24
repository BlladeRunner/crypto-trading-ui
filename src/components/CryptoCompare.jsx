import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetchMarketChart } from "../api/coingecko";
import { formatMoney } from "../utils/format";

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
          : "border-slate-800 hover:border-slate-700 text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function CoinSelect({ label, coins, value, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-amber-400"
      >
        <option value="">Select a coin…</option>
        {coins.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.symbol})
          </option>
        ))}
      </select>
    </div>
  );
}

// series: [{t, v(price)}] -> [{t, v(price), p(pct)}]
function normalizeSeries(series) {
  if (!series?.length) return [];
  const first = series[0]?.v;
  if (!first) return series.map((p) => ({ ...p, p: 0 }));

  return series.map((pt) => ({
    ...pt,
    p: ((pt.v - first) / first) * 100,
  }));
}

function calcChange(series) {
  if (!series?.length) return null;
  const first = series[0].v;
  const last = series[series.length - 1].v;
  if (!first || !last) return null;
  return ((last - first) / first) * 100;
}

// Merge by timestamp: output row has A%, B% + prices for tooltip
function mergeSeries(aSeries, bSeries) {
  const map = new Map();

  for (const p of aSeries) {
    map.set(p.t, { t: p.t, Ap: p.p, Aprice: p.v });
  }
  for (const p of bSeries) {
    const row = map.get(p.t) || { t: p.t };
    row.Bp = p.p;
    row.Bprice = p.v;
    map.set(p.t, row);
  }

  return Array.from(map.values()).sort((x, y) => x.t - y.t);
}

export default function CryptoCompare({ coinsList }) {
  const coins = useMemo(() => {
    return [...coinsList].sort((a, b) => a.name.localeCompare(b.name));
  }, [coinsList]);

  const [coinA, setCoinA] = useState("bitcoin");
  const [coinB, setCoinB] = useState("ethereum");
  const [days, setDays] = useState(365);

  const [aRaw, setARaw] = useState([]);
  const [bRaw, setBRaw] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const aMeta = useMemo(() => coins.find((c) => c.id === coinA), [coins, coinA]);
  const bMeta = useMemo(() => coins.find((c) => c.id === coinB), [coins, coinB]);

  const aSeries = useMemo(() => normalizeSeries(aRaw), [aRaw]);
  const bSeries = useMemo(() => normalizeSeries(bRaw), [bRaw]);

  const merged = useMemo(() => mergeSeries(aSeries, bSeries), [aSeries, bSeries]);

  const aChange = useMemo(() => calcChange(aRaw), [aRaw]);
  const bChange = useMemo(() => calcChange(bRaw), [bRaw]);

  const aLast = aRaw?.length ? aRaw[aRaw.length - 1].v : null;
  const bLast = bRaw?.length ? bRaw[bRaw.length - 1].v : null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!coinA || !coinB) return;
      try {
        setLoading(true);
        setError("");

        const [a, b] = await Promise.all([
          fetchMarketChart({ id: coinA, days, vsCurrency: "usd" }),
          fetchMarketChart({ id: coinB, days, vsCurrency: "usd" }),
        ]);

        if (cancelled) return;
        setARaw(a);
        setBRaw(b);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Chart fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [coinA, coinB, days]);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold">Crypto Compare</div>
          <div className="text-xs text-slate-400">
            Compare two coins by normalized performance (% from start of period)
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill active={days === 7} onClick={() => setDays(7)}>
            7d
          </Pill>
          <Pill active={days === 30} onClick={() => setDays(30)}>
            30d
          </Pill>
          <Pill active={days === 90} onClick={() => setDays(90)}>
            90d
          </Pill>
          <Pill active={days === 365} onClick={() => setDays(365)}>
            1y
          </Pill>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <CoinSelect
            label="Coin A"
            coins={coins}
            value={coinA}
            onChange={(id) => {
              if (id && id === coinB) return;
              setCoinA(id);
            }}
          />
          <CoinSelect
            label="Coin B"
            coins={coins}
            value={coinB}
            onChange={(id) => {
              if (id && id === coinA) return;
              setCoinB(id);
            }}
          />
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-400">A price (now)</div>
            <div className="mt-1 font-mono text-lg text-slate-100">
              {aLast != null ? `$${formatMoney(aLast, 2)}` : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {aMeta ? `${aMeta.name} (${aMeta.symbol})` : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-400">A change</div>
            <div
              className={`mt-1 font-mono text-lg ${
                aChange >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {aChange != null ? `${aChange > 0 ? "+" : ""}${aChange.toFixed(2)}%` : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">over selected period</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-400">B price (now)</div>
            <div className="mt-1 font-mono text-lg text-slate-100">
              {bLast != null ? `$${formatMoney(bLast, 2)}` : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {bMeta ? `${bMeta.name} (${bMeta.symbol})` : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-400">B change</div>
            <div
              className={`mt-1 font-mono text-lg ${
                bChange >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {bChange != null ? `${bChange > 0 ? "+" : ""}${bChange.toFixed(2)}%` : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">over selected period</div>
          </div>
        </div>

        {/* Chart */}
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
          {loading && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-400">
              Loading chart…
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-rose-900/40 bg-rose-950/30 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {!loading && !error && merged.length > 0 && (
            <div style={{ width: "100%", height: 340 }}>
              <ResponsiveContainer>
                <LineChart data={merged} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="t"
                    tickFormatter={(ms) => {
                      const d = new Date(ms);
                      return days <= 30
                        ? `${d.getDate()}/${d.getMonth() + 1}`
                        : `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
                    }}
                    minTickGap={24}
                  />
                  <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                  <Tooltip
                    formatter={(value, name, item) => {
                      const payload = item?.payload || {};
                      if (name === "Ap") {
                        const sym = aMeta?.symbol || "A";
                        const price = payload.Aprice;
                        return [
                          `${Number(value).toFixed(2)}%  •  $${formatMoney(Number(price), 2)}`,
                          `A (${sym})`,
                        ];
                      }
                      if (name === "Bp") {
                        const sym = bMeta?.symbol || "B";
                        const price = payload.Bprice;
                        return [
                          `${Number(value).toFixed(2)}%  •  $${formatMoney(Number(price), 2)}`,
                          `B (${sym})`,
                        ];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(ms) => new Date(ms).toLocaleString()}
                  />
                  <Line type="monotone" dataKey="Ap" dot={false} strokeWidth={2.2} />
                  <Line type="monotone" dataKey="Bp" dot={false} strokeWidth={2.2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!loading && !error && merged.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-400">
              Pick two coins to compare.
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Data source: CoinGecko • Normalized chart (% from start) for easier comparison.
        </div>
      </div>
    </div>
  );
}