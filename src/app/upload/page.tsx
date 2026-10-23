import UploadForm from "./UploadForm";
import { MAX_VIDEO_SECONDS } from "@/lib/golf";

const TIPS = [
  { title: "전신이 나오게", desc: "정면(가슴 방향) 또는 측면(타깃 반대쪽)에서 머리부터 발끝까지 담아 주세요." },
  { title: "한 번의 스윙만", desc: `어드레스부터 피니시까지, ${MAX_VIDEO_SECONDS}초 안에 스윙 한 번이면 돼요.` },
  { title: "휴대폰은 고정", desc: "가로로 세워 고정하면 흔들림이 없어 분석이 더 정확해요." },
];

export default function UploadPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        <div>
          <span className="eyebrow">New Analysis</span>
          <h1 className="page-title mt-3">스윙 영상 올리기</h1>
          <p className="mt-3 text-muted">{MAX_VIDEO_SECONDS}초 이하 영상을 올리고, 사용한 골프채를 선택해 주세요.</p>
        </div>
        <UploadForm />
      </div>
      <aside className="space-y-4 lg:pt-28">
        <div className="card p-6!">
          <div className="eyebrow mb-5">Shooting Tips</div>
          <ul className="space-y-5">
            {TIPS.map((t, i) => (
              <li key={t.title} className="flex gap-3">
                <span className="display text-lg italic text-gold">0{i + 1}</span>
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{t.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="px-2 text-xs leading-relaxed text-muted">
          영상은 본인만 볼 수 있는 비공개 저장소에 보관되며, 분석 외 용도로 사용하지 않아요.
        </p>
      </aside>
    </div>
  );
}
