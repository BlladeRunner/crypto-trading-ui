import { useEffect, useMemo, useRef, useState } from "react";
import { formatMoney } from "../utils/format";

/* ---------------- helpers ---------------- */
function clampNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function makeId() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function StatCard({ label, value, sub, tone = "default" }) {
  const toneClass =
    tone === "pos"
      ? "text-emerald-300"
      : tone === "neg"
      ? "text-rose-300"
      : "text-slate-100";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 font-mono text-lg ${toneClass}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function PillBtn({ active = false, onClick, children }) {
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

/* ---------------- component ---------------- */
export default function ExitPoints({ coinsList = [] }) {
  // Sort coins for select
  const coins = useMemo(() => {
    return [...coinsList]
      .filter((c) => c && c.id && c.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [coinsList]);

  const [coinId, setCoinId] = useState("");
  const [entry, setEntry] = useState("1");
  const [tokens, setTokens] = useState("1000");

  const [tps, setTps] = useState(() => [
    { id: makeId(), price: "1.5", pct: "30" },
    { id: makeId(), price: "2.0", pct: "30" },
    { id: makeId(), price: "3.0", pct: "40" },
  ]);

  const coinMeta = useMemo(() => {
    return coins.find((c) => c.id === coinId) || null;
  }, [coins, coinId]);

  const didAutoFillRef = useRef(false);
  useEffect(() => {
    if (!coinMeta) return;

    const p = clampNum(coinMeta.price, 0);
    if (!p) return;

    didAutoFillRef.current = false;
  }, [coinId, coinMeta]);

  useEffect(() => {
    if (!coinMeta) return;
    const p = clampNum(coinMeta.price, 0);
    if (!p) return;

    if (didAutoFillRef.current) return;

    const entryN = clampNum(entry, 0);
    const entryStr = String(entry ?? "").trim();

    const looksDefault =
      entryStr === "" || entryStr === "0" || entryStr === "1" || entryN === 0;

    if (looksDefault) {
      setEntry(p < 1 ? p.toFixed(6) : p.toFixed(2));
      didAutoFillRef.current = true;
    }
  }, [coinMeta, entry]);

  const entryN = clampNum(entry, 0);
  const tokensN = clampNum(tokens, 0);
  const invested = entryN * tokensN;

  const totalPct = useMemo(() => {
    return tps.reduce((sum, r) => sum + clampNum(r.pct, 0), 0);
  }, [tps]);

  const rows = useMemo(() => {
    return tps.map((r) => {
      const priceN = clampNum(r.price, 0);
      const pctN = clampNum(r.pct, 0);

      const soldTokens = (tokensN * pctN) / 100;
      const proceeds = soldTokens * priceN;

      const costBasis = soldTokens * entryN;
      const profit = proceeds - costBasis;
      const profitPct = costBasis > 0 ? (profit / costBasis) * 100 : 0;

      return {
        ...r,
        priceN,
        pctN,
        soldTokens,
        proceeds,
        profit,
        profitPct,
      };
    });
  }, [tps, entryN, tokensN]);

  const summary = useMemo(() => {
    const soldTokens = rows.reduce((s, r) => s + r.soldTokens, 0);
    const proceeds = rows.reduce((s, r) => s + r.proceeds, 0);

    const costBasis = soldTokens * entryN;
    const profit = proceeds - costBasis;
    const profitPct = costBasis > 0 ? (profit / costBasis) * 100 : 0;

    const remainingTokens = Math.max(tokensN - soldTokens, 0);
    const avgExit = soldTokens > 0 ? proceeds / soldTokens : 0;

    return {
      soldPct: totalPct,
      soldTokens,
      proceeds,
      profit,
      profitPct,
      remainingTokens,
      avgExit,
    };
  }, [rows, entryN, tokensN, totalPct]);

  function addTp() {
    setTps((prev) => [...prev, { id: makeId(), price: "", pct: "" }]);
  }

  function removeTp(id) {
    setTps((prev) => prev.filter((x) => x.id !== id));
  }

  function updateTp(id, patch) {
    setTps((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function resetAll() {
    setCoinId("");
    setEntry("1");
    setTokens("1000");
    setTps([
      { id: makeId(), price: "1.5", pct: "30" },
      { id: makeId(), price: "2.0", pct: "30" },
      { id: makeId(), price: "3.0", pct: "40" },
    ]);
  }

  function autoSplit3() {
    setTps((prev) => {
      const base = prev.slice(0, 3);
      const next = [
        base[0] || { id: makeId(), price: "1.5", pct: "30" },
        base[1] || { id: makeId(), price: "2.0", pct: "30" },
        base[2] || { id: makeId(), price: "3.0", pct: "40" },
      ].map((r, i) => ({ ...r, pct: i === 2 ? "40" : "30" }));
      return next;
    });
  }

  const pctWarn =
    totalPct > 100
      ? "Total Sell % is above 100%. Reduce percentages."
      : totalPct < 100
      ? "Tip: Total Sell % below 100% → some tokens remain unsold."
      : "";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold">Exit Points</div>
          <div className="mt-2 text-xs text-slate-400">
            Plan take-profits and estimate potential profit.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <PillBtn onClick={autoSplit3}>Auto split 30/30/40</PillBtn>
          <PillBtn onClick={resetAll}>Reset</PillBtn>
        </div>
      </div>

      <div className="p-4">
        {/* Inputs */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-400">Coin (optional)</div>
            <select
              value={coinId}
              onChange={(e) => setCoinId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:border-amber-400"
            >
              <option value="">Select coin…</option>
              {coins.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({String(c.symbol || "").toUpperCase()})
                </option>
              ))}
            </select>

            <div className="mt-2 text-xs text-slate-500">
              {coinMeta
                ? `Selected: ${coinMeta.name} (${String(
                    coinMeta.symbol || ""
                  ).toUpperCase()})`
                : "—"}
            </div>

            {coinMeta?.price ? (
              <div className="mt-1 text-xs text-slate-500">
                Current price:{" "}
                <span className="font-mono text-slate-200">
                  ${formatMoney(clampNum(coinMeta.price, 0), 6)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-400">Entry price (USD)</div>
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 0.42"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-amber-400"
            />
            <div className="mt-2 text-xs text-slate-500">
              Used as cost basis.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-400">Tokens</div>
            <input
              value={tokens}
              onChange={(e) => setTokens(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 1000"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-amber-400"
            />
            <div className="mt-2 text-xs text-slate-500">
              Invested:{" "}
              <span className="font-mono text-slate-200">
                ${formatMoney(invested, 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Take-profit table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-3">
            <div className="text-sm font-semibold">Take Profits</div>
            <button
              type="button"
              onClick={addTp}
              className="rounded-xl border border-amber-400/60 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200 hover:border-amber-400"
            >
              + Add TP
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/40 text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">TP price</th>
                  <th className="px-4 py-3 text-left">Sell %</th>
                  <th className="px-4 py-3 text-right">Tokens sold</th>
                  <th className="px-4 py-3 text-right">Proceeds</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3 text-center">✕</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-800 hover:bg-slate-900/30"
                  >
                    <td className="px-4 py-3">
                      <input
                        value={r.price}
                        onChange={(e) =>
                          updateTp(r.id, { price: e.target.value })
                        }
                        inputMode="decimal"
                        placeholder="e.g. 1.25"
                        className="w-36 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 font-mono text-sm outline-none placeholder:text-slate-700 focus:border-amber-400"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          value={r.pct}
                          onChange={(e) => updateTp(r.id, { pct: e.target.value })}
                          inputMode="decimal"
                          placeholder="e.g. 25"
                          className="w-24 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 font-mono text-sm outline-none placeholder:text-slate-700 focus:border-amber-400"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-slate-200">
                      {formatMoney(r.soldTokens, 2)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-slate-200">
                      ${formatMoney(r.proceeds, 2)}
                    </td>

                    <td
                      className={`px-4 py-3 text-right font-mono ${
                        r.profit >= 0 ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {r.profit >= 0 ? "+" : ""}${formatMoney(r.profit, 2)}{" "}
                      <span className="text-xs text-slate-500">
                        ({r.profitPct >= 0 ? "+" : ""}
                        {Number.isFinite(r.profitPct)
                          ? r.profitPct.toFixed(2)
                          : "0.00"}
                        %)
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeTp(r.id)}
                        className="text-slate-500 hover:text-rose-300"
                        title="Remove level"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pctWarn ? (
            <div
              className={`border-t border-slate-800 px-4 py-2 text-xs ${
                totalPct > 100 ? "text-rose-200" : "text-slate-400"
              }`}
            >
              {pctWarn} (Total:{" "}
              <span className="font-mono">{formatMoney(totalPct, 2)}%</span>)
            </div>
          ) : null}
        </div>

        {/* Summary */}
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <StatCard
            label="Total proceeds"
            value={`$${formatMoney(summary.proceeds, 2)}`}
            sub="Sum of all TP sells"
          />
          <StatCard
            label="Total profit"
            value={`${summary.profit >= 0 ? "+" : ""}$${formatMoney(
              summary.profit,
              2
            )}`}
            sub={`${summary.profitPct >= 0 ? "+" : ""}${summary.profitPct.toFixed(
              2
            )}% vs sold cost basis`}
            tone={summary.profit >= 0 ? "pos" : "neg"}
          />
          <StatCard
            label="Tokens remaining"
            value={formatMoney(summary.remainingTokens, 2)}
            sub="Unsold portion"
          />
          <StatCard
            label="Avg exit price"
            value={
              summary.soldTokens > 0
                ? `$${formatMoney(summary.avgExit, 6)}`
                : "—"
            }
            sub="Weighted by sold amount"
          />
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Tip: set Sell % totals to 100% if you want a full exit plan.
        </div>
      </div>
    </div>
  );
}