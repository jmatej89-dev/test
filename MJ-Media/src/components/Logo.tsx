export function LogoMark({ size = 32, className = "", fg = "#fff" }: { size?: number; className?: string; fg?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <rect width="64" height="64" rx="10" fill="currentColor" />
      <g fill="none" stroke={fg} strokeWidth="6" strokeLinecap="butt" strokeLinejoin="miter">
        <polyline points="14,46 14,18 24,33 34,18 34,46" />
        <path d="M49 18 V37 a7.5 7.5 0 0 1 -15 0" />
      </g>
    </svg>
  );
}

export function Logo({ size = 34, wordmark = true, className = "", inverse = false }: { size?: number; wordmark?: boolean; className?: string; inverse?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-[0.55em] ${className}`} style={{ fontSize: size }}>
      <LogoMark size={size} className={inverse ? "text-white shrink-0" : "text-accent shrink-0"} fg={inverse ? "#0f0f0f" : "#fff"} />
      {wordmark && (
        <span className="font-sans leading-none tracking-[-0.035em] whitespace-nowrap" style={{ fontSize: size * 0.74 }}>
          <span className={`font-bold ${inverse ? "text-white" : "text-ink"}`}>MJ</span>
          <span className={`font-normal ${inverse ? "text-white/70" : "text-ink-2"}`}> media</span>
        </span>
      )}
    </span>
  );
}
