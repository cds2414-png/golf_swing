import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { analyzeSwing } from "@/lib/analyze-swing";
import { ageFromBirthYear, isClubType } from "@/lib/golf";

export const maxDuration = 300;

// 결제가 끝난 분석 요청을 GPT로 분석한다. 결제 완료(paid) 또는 실패(failed, 재시도) 상태에서만 실행된다.
export async function POST(_: NextRequest, ctx: RouteContext<"/api/analyses/[id]/run">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const admin = createAdminClient();

  // 상태를 원자적으로 바꿔 같은 요청이 두 번 분석되지 않게 한다.
  const { data: analysis } = await admin
    .from("analyses")
    .update({ status: "analyzing", error_message: null })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", ["paid", "failed"])
    .select("id, club_type, frame_paths, video_duration")
    .maybeSingle();

  if (!analysis) {
    const { data: current } = await supabase.from("analyses").select("status").eq("id", id).maybeSingle();
    if (!current) return NextResponse.json({ error: "분석 요청을 찾을 수 없어요." }, { status: 404 });
    return NextResponse.json({ status: current.status });
  }

  try {
    if (!isClubType(analysis.club_type)) throw new Error("골프채 종류가 올바르지 않아요.");

    const { data: profile } = await admin
      .from("profiles")
      .select("birth_year, gender, handedness")
      .eq("id", user.id)
      .maybeSingle();
    const age = ageFromBirthYear(profile?.birth_year);

    const frames = await Promise.all(
      (analysis.frame_paths as string[]).map(async (path) => {
        const { data, error } = await admin.storage.from("swing-videos").download(path);
        if (error || !data) throw new Error(`프레임을 불러오지 못했어요: ${path}`);
        const base64 = Buffer.from(await data.arrayBuffer()).toString("base64");
        // 파일명 frame_00_1.23.jpg 에서 시각(초)을 꺼낸다.
        const time = Number(path.match(/_([\d.]+)\.jpg$/)?.[1] ?? 0);
        return { dataUrl: `data:image/jpeg;base64,${base64}`, time };
      }),
    );

    const result = await analyzeSwing({
      clubType: analysis.club_type,
      age,
      gender: profile?.gender ?? null,
      handedness: profile?.handedness ?? "right",
      videoDuration: analysis.video_duration ? Number(analysis.video_duration) : null,
      frames,
    });

    await admin
      .from("analyses")
      .update({ status: "completed", result, age_at_analysis: age, completed_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ status: "completed" });
  } catch (err) {
    const message = (err as Error).message;
    console.error("swing analysis failed", id, err);
    await admin.from("analyses").update({ status: "failed", error_message: message }).eq("id", id);
    return NextResponse.json({ status: "failed", error: message }, { status: 500 });
  }
}
