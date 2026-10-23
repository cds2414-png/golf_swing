import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  CLUBS,
  STATUS_LABELS,
  ageFromBirthYear,
  ageGroupLabel,
  formatWon,
  isClubType,
  type AnalysisStatus,
} from "@/lib/golf";

const STATUS_STYLE: Record<AnalysisStatus, string> = {
  pending_payment: "bg-white/5 text-muted",
  paid: "bg-brand-soft text-brand",
  analyzing: "bg-brand-soft text-brand",
  completed: "bg-gold-soft text-gold",
  failed: "bg-danger-soft text-danger",
};

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: analyses }] = await Promise.all([
    supabase.from("profiles").select("name, birth_year").eq("id", user!.id).maybeSingle(),
    supabase
      .from("analyses")
      .select("id, club_type, status, amount, created_at, result->overall_score, result->is_golf_swing")
      .order("created_at", { ascending: false }),
  ]);
  const age = ageFromBirthYear(profile?.birth_year);

  const scores = (analyses ?? [])
    .filter((a) => a.status === "completed" && a.is_golf_swing !== false && typeof a.overall_score === "number")
    .map((a) => a.overall_score as number);
  const stats = [
    { label: "전체 분석", value: `${analyses?.length ?? 0}회` },
    { label: "최고 점수", value: scores.length ? `${Math.max(...scores)}점` : "–" },
    { label: "평균 점수", value: scores.length ? `${Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)}점` : "–" },
  ];

  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="eyebrow">My Swing</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{profile?.name || "회원"}님</h1>
            <p className="mt-2 text-sm text-muted">
              {user!.email}
              {age !== null && ` · ${age}세 · ${ageGroupLabel(age)} 기준 분석`}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-6 md:gap-10">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-muted">{s.label}</dt>
                <dd className="display mt-1 text-2xl font-semibold text-gold-gradient sm:text-3xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">분석 내역</h2>
          <Link href="/upload" className="btn-outline text-sm">
            + 새 스윙 분석
          </Link>
        </div>

        {!analyses?.length ? (
          <div className="card py-14 text-center">
            <p className="text-muted">아직 분석 내역이 없어요.</p>
            <Link href="/upload" className="btn mt-6">
              첫 스윙 분석하기
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {analyses.map((a) => {
              const status = a.status as AnalysisStatus;
              const score = a.overall_score as number | null;
              const clubLabel = isClubType(a.club_type) ? CLUBS[a.club_type].label : a.club_type;
              return (
                <li key={a.id}>
                  <Link
                    href={`/analyses/${a.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-surface/70 px-5 py-4 transition hover:border-gold/40 hover:bg-surface-2/60"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold-soft text-sm font-semibold text-gold">
                      {clubLabel.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{clubLabel}</div>
                      <div className="mt-0.5 text-sm text-muted">
                        {new Date(a.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} ·{" "}
                        {formatWon(a.amount)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.is_golf_swing === false ? (
                        <span className="text-sm text-muted">스윙 인식 불가</span>
                      ) : (
                        score !== null &&
                        score !== undefined && (
                          <span className="display text-2xl font-semibold text-gold-gradient">{score}</span>
                        )
                      )}
                      <span className={`badge ${STATUS_STYLE[status]}`}>{STATUS_LABELS[status]}</span>
                      <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-gold">→</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
