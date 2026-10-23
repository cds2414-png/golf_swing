"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CLUBS, FRAME_COUNT, FRAME_MAX_WIDTH, MAX_VIDEO_SECONDS, formatWon, type ClubType } from "@/lib/golf";
import { extractFrames, getVideoDuration } from "@/lib/video-frames";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export default function UploadForm() {
  const router = useRouter();
  const [club, setClub] = useState<ClubType>("driver");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setFile(null);
    setDuration(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("video/")) return setError("동영상 파일만 올릴 수 있어요.");
    if (selected.size > MAX_FILE_BYTES) return setError("파일이 너무 커요. 50MB 이하로 올려 주세요.");

    try {
      const d = await getVideoDuration(selected);
      // 기기마다 길이가 소수점 단위로 조금씩 달라 0.1초 여유를 둔다.
      if (!Number.isFinite(d) || d > MAX_VIDEO_SECONDS + 0.1) {
        e.target.value = "";
        return setError(`영상 길이가 ${d.toFixed(1)}초예요. ${MAX_VIDEO_SECONDS}초 이하로 잘라서 올려 주세요.`);
      }
      setDuration(d);
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSubmit() {
    if (!file || duration === null) return;
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요해요.");

      const uploadId = crypto.randomUUID();
      const folder = `${user.id}/${uploadId}`;
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";

      setProgress("프레임 추출 중...");
      const frames = await extractFrames(file, FRAME_COUNT, FRAME_MAX_WIDTH);

      setProgress("영상 업로드 중...");
      const videoPath = `${folder}/swing.${ext}`;
      const { error: videoError } = await supabase.storage
        .from("swing-videos")
        .upload(videoPath, file, { contentType: file.type || "video/mp4" });
      if (videoError) throw new Error(`영상 업로드 실패: ${videoError.message}`);

      setProgress(`프레임 업로드 중... (0/${frames.length})`);
      const framePaths: string[] = [];
      for (let i = 0; i < frames.length; i++) {
        const path = `${folder}/frame_${String(i).padStart(2, "0")}_${frames[i].time.toFixed(2)}.jpg`;
        const { error: frameError } = await supabase.storage
          .from("swing-videos")
          .upload(path, frames[i].blob, { contentType: "image/jpeg" });
        if (frameError) throw new Error(`프레임 업로드 실패: ${frameError.message}`);
        framePaths.push(path);
        setProgress(`프레임 업로드 중... (${i + 1}/${frames.length})`);
      }

      setProgress("분석 요청 생성 중...");
      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubType: club, videoPath, framePaths, duration }),
      });
      // 서버 오류 시 JSON이 아닌 응답이 올 수 있다.
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.id) throw new Error(body.error ?? "분석 요청 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");

      router.push(`/analyses/${body.id}/checkout`);
    } catch (err) {
      setError((err as Error).message);
      setProgress(null);
    }
  }

  const busy = progress !== null;

  return (
    <div className="card space-y-8">
      <section>
        <StepTitle n={1} title="골프채 선택" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(Object.keys(CLUBS) as ClubType[]).map((key) => {
            const selected = club === key;
            return (
              <button
                key={key}
                type="button"
                disabled={busy}
                aria-pressed={selected}
                onClick={() => setClub(key)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  selected
                    ? "border-gold/70 bg-gold-soft shadow-[0_0_0_1px_rgba(220,188,118,0.4)]"
                    : "border-border bg-white/[0.02] hover:border-border-strong"
                }`}
              >
                <div className={`font-semibold ${selected ? "text-gold-strong" : ""}`}>{CLUBS[key].label}</div>
                <div className="mt-1 text-sm text-muted">{formatWon(CLUBS[key].price)}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <StepTitle n={2} title={`스윙 영상 선택`} hint={`최대 ${MAX_VIDEO_SECONDS}초 · 50MB · MP4/MOV/WebM`} />
        <label
          htmlFor="video"
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition ${
            file ? "border-brand/50 bg-brand-soft" : "border-border-strong bg-black/20 hover:border-gold/60 hover:bg-gold-soft"
          } ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <svg viewBox="0 0 24 24" className="mb-3 h-8 w-8 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M15 10l4.5-2.5v9L15 14M4 7h11v10H4z" strokeLinejoin="round" />
          </svg>
          <span className="font-semibold">{file ? file.name : "영상을 선택하거나 여기를 눌러 주세요"}</span>
          <span className="mt-1 text-sm text-muted">
            {file ? `${duration?.toFixed(1)}초 · 다른 영상으로 바꾸려면 다시 누르세요` : "어드레스부터 피니시까지 한 번의 스윙"}
          </span>
          <input
            id="video"
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            disabled={busy}
            onChange={handleFile}
            className="sr-only"
          />
        </label>
        {previewUrl && (
          <video src={previewUrl} controls playsInline className="mt-4 max-h-[28rem] w-full rounded-2xl border border-border bg-black" />
        )}
      </section>

      {error && <p className="alert-error">{error}</p>}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-muted">결제 금액</div>
          <div className="display text-3xl font-semibold text-gold-gradient">{formatWon(CLUBS[club].price)}</div>
        </div>
        <button type="button" onClick={handleSubmit} disabled={!file || busy} className="btn px-8 sm:min-w-64">
          {progress ?? `${CLUBS[club].label} 분석 결제하기 →`}
        </button>
      </div>
    </div>
  );
}

function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/50 text-xs font-semibold text-gold">{n}</span>
      <h2 className="font-semibold">{title}</h2>
      {hint && <span className="text-sm text-muted">{hint}</span>}
    </div>
  );
}
