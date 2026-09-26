export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <rect width="64" height="64" rx="10" fill="currentColor" />
      <g fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="butt" strokeLinejoin="miter">
        <polyline points="14,46 14,18 24,33 34,18 34,46" />
        <path d="M49 18 V37 a7.5 7.5 0 0 1 -15 0" />
      </g>
    </svg>
  );
}

export function Logo({ size = 34, wordmark = true, className = "" }: { size?: number; wordmark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} className="text-accent shrink-0" />
      {wordmark && (
        <span className="font-sans leading-none tracking-[-0.03em] whitespace-nowrap" style={{ fontSize: size * 0.72 }}>
          <span className="font-bold text-ink">MJ</span>
          <span className="font-normal text-ink-2"> media</span>
        </span>
      )}
    </span>
  );
}
