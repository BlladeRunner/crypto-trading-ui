export default function Sparkline({
  data = [],
  width = 72,
  height = 22,
  strokeWidth = 2,
  positive = true,
  points = 30,
}) {
  const arr = Array.isArray(data) ? data : [];
  const sliced = arr.length > points ? arr.slice(-points) : arr;

  if (sliced.length < 2) {
    return <div className="h-[22px] w-[72px]" />;
  }

  const min = Math.min(...sliced);
  const max = Math.max(...sliced);
  const range = max - min || 1;

  const stepX = width / (sliced.length - 1);

  const d = sliced
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <polyline
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={positive ? "stroke-emerald-400/90" : "stroke-rose-400/90"}
        points={d}
      />
    </svg>
  );
}