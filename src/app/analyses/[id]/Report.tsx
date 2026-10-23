import Link from "next/link";
import StatusCard from "@/components/StatusCard";
import { PHASE_LABELS, type SwingAnalysisResult } from "@/lib/golf";

const GAP_STYLE = {
  small: { label: "근접", className: "bg-brand-soft text-brand" },
  medium: { label: "보통", className: "bg-gold-soft text-gold" },
  large: { label: "큰 차이", className: "bg-danger-soft text-danger" },
} as const;

function scoreTone(score: number) {
  if (score >= 80) return { bar: "from-brand to-[#7ee8b0]", text: "text-brand", label: "프로에 근접" };
  if (score >= 60) return { bar: "from-gold to-gold-strong", text: "text-gold", label: "양호" };
  return { bar: "from-danger to-[#ffb0a0]", text: "text-danger", label: "집중 개선" };
}

function ScoreRing({ score }: { score: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-44 w-44 shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="score-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f1d79c" />
            <stop offset="100%" stopColor="#b8924a" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="url(#score-gold)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display text-5xl font-semibold text-gold-gradient">{score}</span>
        <span className="mt-1 text-xs tracking-widest text-muted">/ 100</span>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
    </div>
  );
}

export default function Report({ result }: { result: SwingAnalysisResult }) {
  if (!result.is_golf_swing) {
    return (
      <StatusCard
        icon="?"
        title="골프 스윙을 인식하지 못했어요"
        action={
          <Link href="/upload" className="btn">
            새 영상으로 분석하기
          </Link>
        }
      >
        <p>{result.summary}</p>
        <p className="mt-3 text-sm">
          실제 사람이 스윙하는 모습을 휴대폰으로 직접 촬영한 영상만 분석할 수 있어요. 전신이 나오게 다시 찍어 올려 주세요.
        </p>
      </StatusCard>
    );
  }

  const weaknesses = [...result.key_weaknesses].sort((a, b) => a.priority - b.priority);
  const tone = scoreTone(result.overall_score);

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-center">
          <ScoreRing score={result.overall_score} />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Overall Score</span>
              <span className={`badge border border-current/30 ${tone.text}`}>{tone.label}</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">프로 대비 종합 점수</h2>
            <p className="mt-3 leading-relaxed text-muted">{result.summary}</p>
          </div>
        </div>
      </section>

      <section className="card">
        <SectionTitle eyebrow="Key Gaps" title="프로 대비 부족한 점" />
        <ol className="grid gap-4 md:grid-cols-3">
          {weaknesses.map((w, i) => (
            <li key={w.title} className="card-soft relative">
              <div className="display text-4xl font-semibold italic text-gold/80">0{i + 1}</div>
              <div className="mt-3 font-semibold">{w.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{w.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <SectionTitle eyebrow="vs Tour Pro" title="프로 선수와 비교" />
        <div className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs tracking-wider text-muted uppercase">
              <tr className="border-b border-border">
                <th className="py-3 pr-4 font-medium">항목</th>
                <th className="py-3 pr-4 font-medium">내 스윙 (추정)</th>
                <th className="py-3 pr-4 font-medium">프로 기준</th>
                <th className="py-3 font-medium">차이</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.pro_comparison.map((c) => (
                <tr key={c.metric} className="align-top">
                  <td className="py-4 pr-4 font-semibold">{c.metric}</td>
                  <td className="py-4 pr-4 text-foreground/85">{c.user_estimate}</td>
                  <td className="py-4 pr-4 text-muted">{c.pro_benchmark}</td>
                  <td className="py-4">
                    <span className={`badge whitespace-nowrap ${GAP_STYLE[c.gap_level].className}`}>
                      {GAP_STYLE[c.gap_level].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <SectionTitle eyebrow="Phase by Phase" title="구간별 분석" />
        <div className="space-y-4">
          {result.swing_phases.map((p, i) => {
            const t = scoreTone(p.score);
            return (
              <details key={p.phase} className="card-soft group" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center gap-4">
                  <span className="display w-6 text-sm italic text-muted">{i + 1}</span>
                  <span className="w-28 shrink-0 font-semibold">{PHASE_LABELS[p.phase] ?? p.phase}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-white/5">
                    <div className={`h-1.5 rounded-full bg-gradient-to-r ${t.bar}`} style={{ width: `${p.score}%` }} />
                  </div>
                  <span className={`w-10 text-right font-semibold ${t.text}`}>{p.score}</span>
                  <span className="text-muted transition group-open:rotate-180">⌄</span>
                </summary>
                <dl className="mt-5 grid gap-4 border-t border-border pt-5 text-sm md:grid-cols-3">
                  <div>
                    <dt className="mb-1.5 text-xs tracking-wider text-muted uppercase">내 동작</dt>
                    <dd className="leading-relaxed">{p.observation}</dd>
                  </div>
                  <div>
                    <dt className="mb-1.5 text-xs tracking-wider text-muted uppercase">프로 기준</dt>
                    <dd className="leading-relaxed text-foreground/80">{p.pro_standard}</dd>
                  </div>
                  <div className="rounded-xl border border-gold/20 bg-gold-soft p-4">
                    <dt className="mb-1.5 text-xs tracking-wider text-gold uppercase">개선 방법</dt>
                    <dd className="leading-relaxed text-gold-strong">{p.improvement}</dd>
                  </div>
                </dl>
              </details>
            );
          })}
        </div>
      </section>

      <section className="card relative overflow-hidden border-gold/20 bg-gradient-to-br from-surface-2 to-surface">
        <SectionTitle eyebrow="For Your Age" title="연령대 맞춤 조언" />
        <p className="leading-relaxed text-foreground/90">{result.age_considerations}</p>
      </section>

      <section className="card">
        <SectionTitle eyebrow="Practice Plan" title="추천 연습 드릴" />
        <div className="grid gap-4 md:grid-cols-2">
          {result.drills.map((d) => (
            <div key={d.name} className="card-soft flex flex-col">
              <div className="font-semibold">{d.name}</div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{d.how_to}</p>
              <div className="mt-4 inline-flex w-fit rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                {d.reps}
              </div>
            </div>
          ))}
        </div>
      </section>

      {result.video_quality_note && (
        <p className="px-2 text-sm leading-relaxed text-muted">촬영 참고 · {result.video_quality_note}</p>
      )}
    </div>
  );
}
