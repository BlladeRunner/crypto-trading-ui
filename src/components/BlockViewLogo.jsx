export default function BlockViewLogo({ size = 56 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="tileGrad" x1="12" y1="10" x2="52" y2="54">
          <stop stopColor="#FF8A1F" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>

      {/* Background */}
      <g filter="url(#glow)">
        <rect x="10" y="10" width="44" height="44" rx="12" fill="url(#tileGrad)" />
      </g>

      {/* Perfect hex */}
      <polygon
        points="45,32 38.5,43.258 25.5,43.258 19,32 25.5,20.742 38.5,20.742"
        fill="none"
        stroke="#F8FAFC"
        strokeWidth="4.4"
        strokeLinejoin="round"
      />

      {/* Center dot */}
      <circle cx="32" cy="32" r="4.1" fill="#0F172A" />
    </svg>
  );
}
