import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CLUBS,
  STATUS_LABELS,
  ageGroupLabel,
  formatWon,
  isClubType,
  type AnalysisStatus,
  type SwingAnalysisResult,
} from "@/lib/golf";
import AnalysisRunner from "./AnalysisRunner";
import Report from "./Report";
import StatusCard from "@/components/StatusCard";

export default async function AnalysisPage({ params }: PageProps<"/analyses/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: analysis } = await supabase
    .from("analyses")
    .select("id, club_type, status, amount, video_path, age_at_analysis, result, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!analysis || !isClubType(analysis.club_type)) notFound();

  const status = analysis.status as AnalysisStatus;
  const { data: signed } = await supabase.storage.from("swing-videos").createSignedUrl(analysis.video_path, 60 * 60);

  const clubLabel = CLUBS[analysis.club_type].label;
  const meta = [
    new Date(analysis.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }),
    STATUS_LABELS[status],
    analysis.age_at_analysis !== null ? `${analysis.age_at_analysis}세 · ${ageGroupLabel(analysis.age_at_analysis)} 기준` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Swing Report</span>
          <h1 className="page-title mt-3">{clubLabel} 스윙 분석</h1>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
            {meta.map((m, i) => (
              <span key={i} className="flex items-center gap-3">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-muted/50" />}
                {m}
              </span>
            ))}
          </p>
        </div>
        <Link href="/upload" className="btn-outline text-sm">
          + 새 스윙 분석
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
        <aside className="space-y-3 lg:sticky lg:top-24">
          {signed?.signedUrl ? (
            <video
              src={signed.signedUrl}
              controls
              playsInline
              className="max-h-[32rem] w-full rounded-3xl border border-border bg-black"
            />
          ) : (
            <div className="card text-center text-sm text-muted">영상을 불러오지 못했어요.</div>
          )}
          <p className="px-2 text-xs text-muted">분석한 원본 영상 · 본인만 볼 수 있어요</p>
        </aside>

        <div className="min-w-0">
          {status === "pending_payment" && (
            <StatusCard
              icon="₩"
              title="아직 결제가 완료되지 않았어요"
              action={
                <Link href={`/analyses/${id}/checkout`} className="btn">
                  {formatWon(analysis.amount)} 결제하고 분석받기
                </Link>
              }
            >
              결제가 끝나면 바로 AI 분석이 시작돼요.
            </StatusCard>
          )}

          {(status === "paid" || status === "analyzing" || status === "failed") && (
            <AnalysisRunner id={id} status={status} />
          )}

          {status === "completed" && analysis.result && <Report result={analysis.result as SwingAnalysisResult} />}
        </div>
      </div>
    </div>
  );
}
