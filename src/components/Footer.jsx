import BlockViewLogo from "./BlockViewLogo";

export default function Footer({ apiStatus = "Live", lastUpdated = "just now" }) {
  return (
    <footer className="mt-10 border-t border-slate-800/80 bg-gradient-to-b from-slate-950/60 to-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Top row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <BlockViewLogo size={40} />

            <div className="leading-tight">
                <div className="font-semibold tracking-tight">BlockView</div>
                <div className="text-xs text-slate-400">CoinScope</div>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="relative flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                API: <span className="text-emerald-400">Live</span>
            </span>

            <span className="rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 text-slate-300">
              Updated: <span className="text-slate-100">{lastUpdated}</span>
            </span>

            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-amber-200">
              UI demo
            </span>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-800/60 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} BlockView. Market data for informational purposes only.
          </p>

          <div className="flex flex-wrap gap-3 text-xs">
            <a
              className="text-slate-400 hover:text-slate-200 transition"
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a className="text-slate-400 hover:text-slate-200 transition" href="#">
              Terms
            </a>
            <a className="text-slate-400 hover:text-slate-200 transition" href="#">
              Privacy
            </a>

            <span className="text-slate-600">•</span>

            <button
              className="text-slate-400 hover:text-orange-300 transition"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
