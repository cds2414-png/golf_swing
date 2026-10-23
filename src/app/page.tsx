import Link from "next/link";
import SwingArc from "@/components/SwingArc";
import { CLUBS, FRAME_COUNT, MAX_VIDEO_SECONDS, formatWon } from "@/lib/golf";

const STATS = [
  { value: `${MAX_VIDEO_SECONDS}초`, label: "촬영 한 번이면 충분" },
  { value: `${FRAME_COUNT}컷`, label: "프레임 단위 정밀 분석" },
  { value: "6구간", label: "어드레스부터 피니시까지" },
  { value: "약 1분", label: "리포트 완성까지" },
];

const FEATURES = [
  {
    title: "프로 기준과 1:1 비교",
    desc: "어깨·골반 회전, 체중 이동, 어택 앵글을 투어 프로 평균 수치와 나란히 비교해 차이를 보여드려요.",
  },
  {
    title: "나이에 맞춘 현실적 목표",
    desc: "유연성과 근력은 나이마다 달라요. 같은 연령대가 도달할 수 있는 목표와 부상 위험을 함께 짚어요.",
  },
  {
    title: "골프채별 맞춤 체크",
    desc: "드라이버의 어퍼 블로, 아이언의 다운블로, 퍼터의 시계추까지 클럽마다 다른 핵심을 봐요.",
  },
  {
    title: "바로 쓰는 연습 드릴",
    desc: "부족한 점마다 연습장에서 바로 할 수 있는 드릴과 횟수를 처방해 드려요.",
  },
];

const STEPS = [
  { title: "스윙 촬영", desc: `정면이나 측면에서 전신이 나오게 ${MAX_VIDEO_SECONDS}초 이하로 찍어요.` },
  { title: "골프채 선택·결제", desc: "사용한 클럽을 고르고 토스페이먼츠로 간편하게 결제해요." },
  { title: "AI 리포트 확인", desc: "프로 대비 부족한 점, 구간별 점수, 연습 드릴을 받아요." },
];

function SampleReport() {
  const bars = [
    { label: "어드레스", score: 82 },
    { label: "백스윙 탑", score: 68 },
    { label: "임팩트", score: 74 },
    { label: "피니시", score: 88 },
  ];
  return (
    <div className="card relative w-full max-w-sm p-6!">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted">드라이버 · 50대 기준</div>
          <div className="mt-1 font-semibold">프로 대비 종합 점수</div>
        </div>
        <div className="display text-5xl font-semibold text-gold-gradient">78</div>
      </div>
      <div className="space-y-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted">{b.label}</span>
              <span>{b.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-brand to-gold" style={{ width: `${b.score}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-gold/20 bg-gold-soft p-3 text-xs leading-relaxed text-gold-strong">
        우선 개선: 다운스윙에서 하체 리드가 늦어요. ‘왼발 밟기’ 드릴을 하루 20회 해 보세요.
      </div>
    </div>
  );
}

export default function Home() {
  return (
    // 장식(스윙 궤적·광원)이 좁은 화면에서 가로 스크롤을 만들지 않도록 잘라낸다
    <div className="-mx-4 space-y-28 overflow-x-clip px-4 sm:-mx-6 sm:px-6">
      {/* 히어로 */}
      <section className="relative grid items-center gap-12 pt-4 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="eyebrow">
            <span className="h-px w-8 bg-gold" /> AI Golf Swing Analysis
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.15] tracking-tight sm:text-6xl">
            당신의 스윙,
            <br />
            <span className="display italic text-gold-gradient">프로의 눈</span>으로 다시 보다
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            {MAX_VIDEO_SECONDS}초 영상 하나로 투어 프로와 무엇이 다른지 정확히 짚어 드립니다. 나이와 골프채에 맞춘 현실적인
            목표와 연습법까지, 1분이면 완성되는 개인 스윙 리포트.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/upload" className="btn px-8 py-4 text-base">
              지금 스윙 분석하기 →
            </Link>
            <a href="#how" className="btn-outline px-6 py-4">
              이용 방법 보기
            </a>
          </div>
        </div>
        <div className="relative flex min-h-[420px] items-center justify-center sm:min-h-[520px]">
          <SwingArc className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 sm:h-[560px] sm:w-[560px]" />
          <div className="relative z-10 w-full max-w-[19rem] sm:max-w-sm">
            <SampleReport />
          </div>
        </div>
      </section>

      {/* 수치 */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-surface px-6 py-8">
            <div className="display text-3xl font-semibold text-gold-gradient sm:text-4xl">{s.value}</div>
            <div className="mt-2 text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </section>

      {/* 특징 */}
      <section>
        <div className="max-w-2xl">
          <span className="eyebrow">Why SwingCheck</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">레슨 한 번 값으로, 매 라운드 전에</h2>
          <p className="mt-4 text-muted">감이 아닌 기준으로. 스윙의 어디가 프로와 다른지, 무엇부터 고쳐야 하는지 알려드려요.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card group transition hover:border-gold/30">
              <div className="display text-sm italic text-gold">0{i + 1}</div>
              <h3 className="mt-3 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 이용 방법 */}
      <section id="how" className="scroll-mt-24">
        <span className="eyebrow">How it works</span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">세 단계면 끝나요</h2>
        <ol className="mt-12 grid gap-4 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card relative overflow-hidden">
              <div className="display absolute -top-4 right-4 text-8xl font-semibold text-white/[0.04]">{i + 1}</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-sm font-semibold text-gold">
                {i + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 요금 */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Pricing</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">골프채별 분석 요금</h2>
          </div>
          <p className="text-sm text-muted">1회 결제 · 구독 없음 · 분석 실패 시 무료 재분석</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(CLUBS).map(([key, club]) => (
            <div key={key} className="card flex flex-col transition hover:border-gold/30">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{club.label}</h3>
                <div className="display text-2xl font-semibold text-gold">{formatWon(club.price)}</div>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{club.focus}</p>
              <Link href="/upload" className="btn-outline mt-6 text-sm">
                {club.label} 분석하기
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 마무리 CTA */}
      <section className="relative overflow-hidden rounded-[2rem] border border-gold/20 bg-gradient-to-br from-surface-2 via-surface to-background px-6 py-16 text-center sm:px-12">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <h2 className="relative text-3xl font-bold tracking-tight sm:text-5xl">
          다음 라운드는 <span className="display italic text-gold-gradient">다르게</span>
        </h2>
        <p className="relative mx-auto mt-5 max-w-lg text-muted">지금 휴대폰으로 스윙 한 번 찍어 보세요. 1분 뒤 리포트가 도착해요.</p>
        <Link href="/upload" className="btn relative mt-10 px-10 py-4 text-base">
          무료 가입하고 시작하기
        </Link>
      </section>
    </div>
  );
}
