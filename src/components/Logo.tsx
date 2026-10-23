// 공과 스윙 궤적을 형상화한 브랜드 마크
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f1d79c" />
          <stop offset="100%" stopColor="#b8924a" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="none" stroke="url(#logo-gold)" strokeWidth="1.5" opacity="0.6" />
      <path d="M8 27 C 12 10, 28 6, 33 16" fill="none" stroke="url(#logo-gold)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="26" cy="27" r="4" fill="#eef4f0" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="display text-xl font-semibold text-foreground">
          Swing<span className="italic text-gold">Check</span>
        </span>
        <span className="mt-1 text-[10px] tracking-[0.3em] text-muted">AI 스윙 분석</span>
      </span>
    </span>
  );
}
