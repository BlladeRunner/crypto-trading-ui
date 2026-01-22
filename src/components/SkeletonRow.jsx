export default function SkeletonRow() {
  return (
    <tr className="border-t border-slate-800">
      {/* Coin */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-full bg-slate-800" />
          <div className="space-y-1">
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="h-2 w-10 bg-slate-800 rounded" />
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-right">
        <div className="ml-auto h-3 w-16 bg-slate-800 rounded animate-pulse" />
      </td>

      {/* 24h */}
      <td className="px-4 py-3 text-right">
        <div className="ml-auto h-3 w-12 bg-slate-800 rounded animate-pulse" />
      </td>

      {/* Market cap */}
      <td className="px-4 py-3 text-right">
        <div className="ml-auto h-3 w-20 bg-slate-800 rounded animate-pulse" />
      </td>

      {/* Volume */}
      <td className="px-4 py-3 text-right">
        <div className="ml-auto h-3 w-20 bg-slate-800 rounded animate-pulse" />
      </td>

      {/* Trend */}
      <td className="px-4 py-3 text-right">
        <div className="ml-auto h-6 w-[72px] bg-slate-800 rounded animate-pulse" />
      </td>

      {/* Star */}
      <td className="px-4 py-3 text-center">
        <div className="mx-auto h-4 w-4 bg-slate-800 rounded-full animate-pulse" />
      </td>
    </tr>
  );
}