// 히어로 일러스트: 스윙 궤적을 따라 찍힌 분석 프레임(점)과 임팩트 지점
export default function SwingArc({ className = "" }: { className?: string }) {
  const frames = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;
    const angle = Math.PI * (1.08 + 1.25 * t);
    return { x: 200 + Math.cos(angle) * 150, y: 210 + Math.sin(angle) * 150, t };
  });

  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="arc-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f1d79c" stopOpacity="0" />
          <stop offset="50%" stopColor="#dcbc76" />
          <stop offset="100%" stopColor="#3ad482" />
        </linearGradient>
        <radialGradient id="arc-glow">
          <stop offset="0%" stopColor="#3ad482" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3ad482" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="210" r="190" fill="url(#arc-glow)" />
      {[150, 115, 80].map((r) => (
        <circle key={r} cx="200" cy="210" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 6" />
      ))}
      <path
        d={`M ${frames[0].x} ${frames[0].y} A 150 150 0 1 1 ${frames[19].x} ${frames[19].y}`}
        fill="none"
        stroke="url(#arc-gold)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {frames.map((f, i) => (
        <circle
          key={i}
          cx={f.x}
          cy={f.y}
          r={i === 12 ? 7 : 3.5}
          fill={i === 12 ? "#eef4f0" : "#dcbc76"}
          opacity={0.35 + f.t * 0.65}
        />
      ))}
      <circle cx={frames[12].x} cy={frames[12].y} r="16" fill="none" stroke="#3ad482" strokeOpacity="0.6" />
      <line x1="40" y1="360" x2="360" y2="360" stroke="rgba(255,255,255,0.1)" />
    </svg>
  );
}
