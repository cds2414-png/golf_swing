import type { FrameMarker } from "@/lib/golf";

// 영상에서 캡처한 프레임 위에 AI가 짚은 문제 위치를 번호 원과 설명으로 표시한다.
export default function AnnotatedFrame({
  src,
  markers = [],
  caption,
  className = "",
}: {
  src: string;
  markers?: FrameMarker[];
  caption?: string;
  className?: string;
}) {
  const clamp = (v: number) => Math.min(0.97, Math.max(0.03, v));

  return (
    <figure className={className}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase 서명 URL이라 next/image 최적화 대상이 아니다 */}
        <img src={src} alt={caption ?? "스윙 캡처"} className="block h-auto w-full" loading="lazy" />
        {markers.map((m, i) => {
          const x = clamp(m.x);
          const y = clamp(m.y);
          // 오른쪽 가장자리 마커는 설명을 왼쪽으로 띄워 잘리지 않게 한다.
          const labelLeft = x > 0.6;
          return (
            <div key={i} className="absolute" style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
              <span className="absolute -top-5 -left-5 h-10 w-10 animate-ping rounded-full border-2 border-danger/60" />
              <span className="absolute -top-5 -left-5 flex h-10 w-10 items-center justify-center rounded-full border-2 border-danger bg-danger/20 shadow-[0_0_12px_rgba(255,122,122,0.6)]">
                <span className="text-xs font-bold text-white drop-shadow">{i + 1}</span>
              </span>
              <span
                className={`absolute top-6 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[11px] font-semibold text-white ring-1 ring-danger/50 ${
                  labelLeft ? "right-0" : "left-0"
                }`}
              >
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
      {caption && <figcaption className="mt-2 text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}
