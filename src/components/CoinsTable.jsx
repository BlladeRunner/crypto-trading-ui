function SortIcon({ active, dir }) {
  if (!active) {
    return (
      <span className="ml-1 text-slate-600" aria-hidden="true">
        ↕
      </span>
    );
  }

  return (
    <span className="ml-1 text-amber-300" aria-hidden="true">
      {dir === "desc" ? "↓" : "↑"}
    </span>
  );
}

export default function CoinsTable({ coins, sort, onSortChange }) {
  if (!coins.length) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-sm text-slate-400">
      No coins found. Try another search.
    </div>
  );
}

  function toggleSort(key) {
    onSortChange((prev) => {
      if (prev.key !== key) return { key, dir: "desc" };
      return { key, dir: prev.dir === "desc" ? "asc" : "desc" };
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/60 text-xs text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Coin</th>
            <th
              className="px-4 py-3 text-right cursor-pointer select-none hover:text-slate-200"
              onClick={() => toggleSort("price")}
            >
              Price <SortIcon active={sort?.key === "price"} dir={sort?.dir} />
            </th> 
            <th
              className="px-4 py-3 text-right cursor-pointer select-none hover:text-slate-200"
              onClick={() => toggleSort("change24h")}
            >
              24h <SortIcon active={sort?.key === "change24h"} dir={sort?.dir} />
            </th>
            <th
              className="px-4 py-3 text-right cursor-pointer select-none hover:text-slate-200"
              onClick={() => toggleSort("marketCap")}
            >
              Market Cap <SortIcon active={sort?.key === "marketCap"} dir={sort?.dir} />
            </th>
            <th
              className="px-4 py-3 text-right cursor-pointer select-none hover:text-slate-200"
              onClick={() => toggleSort("volume24h")}
            >
              Volume (24h) <SortIcon active={sort?.key === "volume24h"} dir={sort?.dir} />
            </th>
            <th className="px-4 py-3 text-center">⭐</th>
          </tr>
        </thead>

        <tbody>
          {coins.map((coin) => (
            <tr
              key={coin.id}
              className="border-t border-slate-800 hover:bg-slate-900/40"
            >
              {/* Coin */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-800" />
                  <div>
                    <div className="font-medium">{coin.name}</div>
                    <div className="text-xs text-slate-400">
                      {coin.symbol}
                    </div>
                  </div>
                </div>
              </td>

              {/* Price */}
              <td className="px-4 py-3 text-right font-mono">
                ${coin.price.toLocaleString()}
              </td>

              {/* 24h */}
              <td
                className={`px-4 py-3 text-right font-mono ${
                  coin.change24h >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {coin.change24h > 0 ? "+" : ""}
                {coin.change24h}%
              </td>

              {/* Market Cap */}
              <td className="px-4 py-3 text-right font-mono text-slate-300">
                ${coin.marketCap.toLocaleString()}
              </td>

              {/* Volume */}
              <td className="px-4 py-3 text-right font-mono text-slate-300">
                ${coin.volume24h.toLocaleString()}
              </td>

              {/* Watchlist */}
              <td className="px-4 py-3 text-center text-slate-500">☆</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
