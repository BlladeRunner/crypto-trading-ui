// src/components/CryptoCompare.jsx
import { ArrowLeftRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
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
        className="
          mt-2 w-full rounded-xl
          border border-slate-800
          bg-slate-950/50
          px-3 py-2 text-sm
          outline-none focus:border-amber-400
          appearance-none
          pr-12
          bg-no-repeat
          bg-[length:20px_20px]
          bg-[position:right_1.25rem_center]
        "
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23CBD5E1' stroke-width='2'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
        }}
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

// Merge by timestamp: output row has A%, B%, C% + prices for tooltip
function merge3Series(aSeries, bSeries, cSeries) {
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
  for (const p of cSeries) {
    const row = map.get(p.t) || { t: p.t };
    row.Cp = p.p;
    row.Cprice = p.v;
    map.set(p.t, row);
  }

  return Array.from(map.values()).sort((x, y) => x.t - y.t);
}

function shortLabel(meta, fallback) {
  if (!meta) return fallback;
  const sym = (meta.symbol || "").toUpperCase();
  return `${meta.name} (${sym})`;
}

export default function CryptoCompare({ coinsList = [] }) {
  const coins = useMemo(() => {
    return [...coinsList].sort((a, b) => a.name.localeCompare(b.name));
  }, [coinsList]);

  // defaults
  const [coinA, setCoinA] = useState("bitcoin");
  const [coinB, setCoinB] = useState("ethereum");
  const [coinC, setCoinC] = useState("");

  const [days, setDays] = useState(365);

  const [aRaw, setARaw] = useState([]);
  const [bRaw, setBRaw] = useState([]);
  const [cRaw, setCRaw] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const aMeta = useMemo(() => coins.find((c) => c.id === coinA), [coins, coinA]);
  const bMeta = useMemo(() => coins.find((c) => c.id === coinB), [coins, coinB]);
  const cMeta = useMemo(() => coins.find((c) => c.id === coinC), [coins, coinC]);

  const aSeries = useMemo(() => normalizeSeries(aRaw), [aRaw]);
  const bSeries = useMemo(() => normalizeSeries(bRaw), [bRaw]);
  const cSeries = useMemo(() => normalizeSeries(cRaw), [cRaw]);

  const merged = useMemo(
    () => merge3Series(aSeries, bSeries, cSeries),
    [aSeries, bSeries, cSeries]
  );

  const aChange = useMemo(() => calcChange(aRaw), [aRaw]);
  const bChange = useMemo(() => calcChange(bRaw), [bRaw]);
  const cChange = useMemo(() => calcChange(cRaw), [cRaw]);

  const aLast = aRaw?.length ? aRaw[aRaw.length - 1].v : null;
  const bLast = bRaw?.length ? bRaw[bRaw.length - 1].v : null;
  const cLast = cRaw?.length ? cRaw[cRaw.length - 1].v : null;

  function switchCoins() {
    // swap A and B only (C stays)
    setCoinA(coinB);
    setCoinB(coinA);
  }

  function CustomTooltip({ active, label, payload }) {
    if (!active || !payload?.length) return null;

    const date = new Date(label).toLocaleString();

    const rows = payload
      .filter((p) => p?.dataKey)
      .map((p) => {
        const key = p.dataKey; // "Ap" | "Bp" | "Cp"
        const row = p.payload || {};

        if (key === "Ap") {
          return {
            name: shortLabel(aMeta, "Coin A"),
            pct: row.Ap,
            price: row.Aprice,
            color: p.color,
          };
        }
        if (key === "Bp") {
          return {
            name: shortLabel(bMeta, "Coin B"),
            pct: row.Bp,
            price: row.Bprice,
            color: p.color,
          };
        }
        if (key === "Cp") {
          return {
            name: shortLabel(cMeta, "Coin C"),
            pct: row.Cp,
            price: row.Cprice,
            color: p.color,
          };
        }
        return null;
      })
      .filter(Boolean);

    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-3 text-xs shadow-lg">
        <div className="mb-2 text-slate-300">{date}</div>

        <div className="space-y-1">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: r.color }}
                />
                <span className="text-slate-200">{r.name}</span>
              </div>

              <div className="font-mono text-slate-200">
                {Number.isFinite(r.pct) ? `${Number(r.pct).toFixed(2)}%` : "—"}
                <span className="mx-2 text-slate-500">•</span>
                {r.price != null ? `$${formatMoney(Number(r.price), 2)}` : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!coinA || !coinB) return;

      try {
        setLoading(true);
        setError("");

        const reqs = [
          fetchMarketChart({ id: coinA, days, vsCurrency: "usd" }),
          fetchMarketChart({ id: coinB, days, vsCurrency: "usd" }),
          coinC ? fetchMarketChart({ id: coinC, days, vsCurrency: "usd" }) : Promise.resolve([]),
        ];

        const [a, b, c] = await Promise.all(reqs);

        if (cancelled) return;
        setARaw(a);
        setBRaw(b);
        setCRaw(c);
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
  }, [coinA, coinB, coinC, days]);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold">Crypto Compare</div>
          <div className="mt-2 text-xs text-slate-400">
            Compare three coins by normalized performance (% from start of period)
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
        <div className="relative mt-2 grid gap-3 md:grid-cols-[1fr_auto_1fr_1fr] md:items-center">
          <CoinSelect
            label="Coin A"
            coins={coins}
            value={coinA}
            onChange={(id) => {
              if (!id) return;
              if (id === coinB || id === coinC) return;
              setCoinA(id);
            }}
          />

          {/* Switch button between A and B */}
          <div className="relative z-10 flex justify-center">
            <button
              type="button"
              onClick={switchCoins}
              className="
                group
                h-11 w-11 rounded-full
                border border-amber-400/60
                bg-amber-400/10
                text-amber-200
                shadow-[0_0_18px_rgba(245,158,11,0.25)]
                ring-1 ring-amber-300/20
                transition
                hover:bg-amber-400/15
                hover:shadow-[0_0_22px_rgba(245,158,11,0.35)]
                active:scale-[0.96]
              "
              title="Switch A/B"
              aria-label="Switch A/B"
            >
              <ArrowLeftRight
                size={18}
                strokeWidth={2.2}
                className="mx-auto transition-transform group-hover:rotate-180"
              />
            </button>
          </div>

          <CoinSelect
            label="Coin B"
            coins={coins}
            value={coinB}
            onChange={(id) => {
              if (!id) return;
              if (id === coinA || id === coinC) return;
              setCoinB(id);
            }}
          />

          <CoinSelect
            label="Coin C"
            coins={coins}
            value={coinC}
            onChange={(id) => {
              // allow empty (no C)
              if (!id) return setCoinC("");
              if (id === coinA || id === coinB) return;
              setCoinC(id);
            }}
          />
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          {/* A */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
            <div className="text-xs text-slate-400">A price (now)</div>
            <div className="mt-1 font-mono text-lg text-slate-100">
              {aLast != null ? `$${formatMoney(aLast, 2)}` : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">{shortLabel(aMeta, "—")}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-1">
            <div className="text-xs text-slate-400">A change</div>
            <div
              className={`mt-1 font-mono text-lg ${
                aChange >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {aChange != null ? `${aChange > 0 ? "+" : ""}${aChange.toFixed(2)}%` : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">period</div>
          </div>

          {/* B */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
            <div className="text-xs text-slate-400">B price (now)</div>
            <div className="mt-1 font-mono text-lg text-slate-100">
              {bLast != null ? `$${formatMoney(bLast, 2)}` : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">{shortLabel(bMeta, "—")}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-1">
            <div className="text-xs text-slate-400">B change</div>
            <div
              className={`mt-1 font-mono text-lg ${
                bChange >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {bChange != null ? `${bChange > 0 ? "+" : ""}${bChange.toFixed(2)}%` : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">period</div>
          </div>

          {/* C */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
            <div className="text-xs text-slate-400">C price (now)</div>
            <div className="mt-1 font-mono text-lg text-slate-100">
              {coinC ? (cLast != null ? `$${formatMoney(cLast, 2)}` : "—") : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {coinC ? shortLabel(cMeta, "—") : "Optional (can be empty)"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-1">
            <div className="text-xs text-slate-400">C change</div>
            <div
              className={`mt-1 font-mono text-lg ${
                cChange >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {coinC && cChange != null ? `${cChange > 0 ? "+" : ""}${cChange.toFixed(2)}%` : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">period</div>
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
            <div style={{ width: "100%", height: 360 }}>
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
                  <YAxis tickFormatter={(v) => `${Number(v).toFixed(0)}%`} />

                  <Legend
                    verticalAlign="top"
                    height={28}
                    formatter={(value) => {
                      if (value === "Ap") return shortLabel(aMeta, "Coin A");
                      if (value === "Bp") return shortLabel(bMeta, "Coin B");
                      if (value === "Cp") return shortLabel(cMeta, "Coin C");
                      return value;
                    }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Line
                    type="monotone"
                    dataKey="Ap"
                    name="Ap"
                    dot={false}
                    stroke="#F97316" // orange
                    strokeWidth={2.4}
                  />
                  <Line
                    type="monotone"
                    dataKey="Bp"
                    name="Bp"
                    dot={false}
                    stroke="#38BDF8" // blue
                    strokeWidth={2.4}
                  />
                  {/* C line only if selected */}
                  {coinC ? (
                    <Line
                      type="monotone"
                      dataKey="Cp"
                      name="Cp"
                      dot={false}
                      stroke="#22C55E" // green
                      strokeWidth={2.4}
                    />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!loading && !error && merged.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-400">
              Pick coins to compare.
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