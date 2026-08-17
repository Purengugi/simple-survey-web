interface LogoMarkProps {
  size?: number;
  className?: string;
}

export default function LogoMark({ size = 40, className = '' }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8A2A5C" />
          <stop offset="100%" stopColor="#4A1030" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="200" rx="46" fill="url(#logo-bg)" />
      <path
        d="M 44 138 C 78 150, 82 108, 108 100 C 134 92, 128 58, 156 50"
        fill="none"
        stroke="#D9A94E"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <circle cx="44" cy="138" r="8" fill="#F1D9BE" />
      <circle cx="156" cy="50" r="12" fill="#D9A94E" />
    </svg>
  );
}
