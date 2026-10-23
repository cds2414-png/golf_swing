"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import StatusCard from "@/components/StatusCard";

// 결제 완료 상태면 분석을 시작하고, 분석 중이면 끝날 때까지 화면을 갱신한다.
export default function AnalysisRunner({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(status === "paid" || status === "analyzing");

  const run = useCallback(async () => {
    setError(null);
    setRunning(true);
    try {
      const res = await fetch(`/api/analyses/${id}/run`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setError(body.error ?? "분석에 실패했어요.");
    } catch {
      setError("네트워크 오류로 분석 요청에 실패했어요.");
    } finally {
      setRunning(false);
      router.refresh();
    }
  }, [id, router]);

  useEffect(() => {
    if (status === "paid" && !started.current) {
      started.current = true;
      run();
    }
  }, [status, run]);

  // 다른 탭에서 분석이 진행 중이면 주기적으로 상태를 확인한다.
  useEffect(() => {
    if (status !== "analyzing") return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [status, router]);

  if (status === "failed") {
    return (
      <StatusCard
        icon="!"
        tone="danger"
        title="분석에 실패했어요"
        action={
          <button type="button" onClick={run} disabled={running} className="btn">
            {running ? "분석 중..." : "다시 분석하기"}
          </button>
        }
      >
        {error ?? "일시적인 오류일 수 있어요. 추가 결제 없이 다시 시도할 수 있어요."}
      </StatusCard>
    );
  }

  return <AnalyzingCard error={error} />;
}

const STAGES = ["프레임 확인", "구간별 동작 분석", "프로 기준과 비교", "연령 맞춤 조언 작성", "리포트 정리"];

function AnalyzingCard({ error }: { error: string | null }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 11000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card py-12">
      <div className="mx-auto max-w-sm text-center">
        <div className="relative mx-auto mb-6 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold" />
          <div className="absolute inset-3 rounded-full bg-gold-soft" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">AI가 스윙을 분석하고 있어요</h2>
        <p className="mt-2 text-sm text-muted">보통 1분 정도 걸려요. 이 화면을 닫지 말고 기다려 주세요.</p>
      </div>
      <ol className="mx-auto mt-8 max-w-xs space-y-3">
        {STAGES.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                i < stage
                  ? "border-brand bg-brand text-background"
                  : i === stage
                    ? "animate-pulse border-gold text-gold"
                    : "border-border-strong text-muted"
              }`}
            >
              {i < stage ? "✓" : i + 1}
            </span>
            <span className={i <= stage ? "text-foreground" : "text-muted"}>{label}</span>
          </li>
        ))}
      </ol>
      {error && <p className="alert-error mx-auto mt-6 max-w-sm">{error}</p>}
    </div>
  );
}
