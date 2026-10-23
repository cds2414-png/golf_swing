import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CLUBS, FRAME_COUNT, MAX_VIDEO_SECONDS, isClubType } from "@/lib/golf";

// 업로드가 끝난 영상으로 결제 대기 상태의 분석 요청을 만든다.
// 금액은 클라이언트가 아닌 서버의 요금표로 정한다.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { clubType, videoPath, framePaths, duration } = body ?? {};

  if (!isClubType(clubType)) return NextResponse.json({ error: "골프채 종류가 올바르지 않아요." }, { status: 400 });
  const ownPath = (p: unknown) => typeof p === "string" && p.startsWith(`${user.id}/`) && !p.includes("..");
  if (!ownPath(videoPath)) return NextResponse.json({ error: "영상 경로가 올바르지 않아요." }, { status: 400 });
  if (!Array.isArray(framePaths) || framePaths.length === 0 || framePaths.length > FRAME_COUNT || !framePaths.every(ownPath)) {
    return NextResponse.json({ error: "프레임 정보가 올바르지 않아요." }, { status: 400 });
  }
  if (typeof duration !== "number" || duration <= 0 || duration > MAX_VIDEO_SECONDS + 0.1) {
    return NextResponse.json({ error: `영상은 ${MAX_VIDEO_SECONDS}초 이하여야 해요.` }, { status: 400 });
  }

  const admin = createAdminClient();
  const orderId = `GS${Date.now()}${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const { data, error } = await admin
    .from("analyses")
    .insert({
      user_id: user.id,
      club_type: clubType,
      video_path: videoPath,
      frame_paths: framePaths,
      video_duration: Math.round(duration * 100) / 100,
      amount: CLUBS[clubType].price,
      order_id: orderId,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: `저장 실패: ${error.message}` }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
