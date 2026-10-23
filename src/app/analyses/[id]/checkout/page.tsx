import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CLUBS, formatWon, isClubType } from "@/lib/golf";
import CheckoutWidget from "./CheckoutWidget";

const INCLUDED = ["프로 대비 종합 점수", "6개 구간별 점수와 개선법", "프로 기준 비교표", "연령 맞춤 조언", "맞춤 연습 드릴"];

export default async function CheckoutPage({ params }: PageProps<"/analyses/[id]/checkout">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/analyses/${id}/checkout`);

  const [{ data: analysis }, { data: profile }] = await Promise.all([
    supabase.from("analyses").select("id, club_type, amount, order_id, status").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
  ]);
  if (!analysis || !isClubType(analysis.club_type)) notFound();
  if (analysis.status !== "pending_payment") redirect(`/analyses/${id}`);

  const club = CLUBS[analysis.club_type];
  const orderName = `골프 스윙 분석 (${club.label})`;

  return (
    <div className="space-y-8">
      <div>
        <span className="eyebrow">Checkout</span>
        <h1 className="page-title mt-3">결제하기</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <CheckoutWidget
          clientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!}
          customerKey={user.id}
          amount={analysis.amount}
          orderId={analysis.order_id}
          orderName={orderName}
          customerEmail={user.email ?? undefined}
          customerName={profile?.name || undefined}
        />
        <aside className="card order-first lg:sticky lg:top-24 lg:order-last">
          <div className="text-sm text-muted">주문 상품</div>
          <div className="mt-1 text-lg font-semibold">{orderName}</div>
          <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-foreground/90">
                <span className="text-gold">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-baseline justify-between border-t border-border pt-5">
            <span className="text-muted">결제 금액</span>
            <span className="display text-3xl font-semibold text-gold-gradient">{formatWon(analysis.amount)}</span>
          </div>
          <p className="mt-3 text-xs text-muted">결제 후 바로 AI 분석이 시작돼요. 분석에 실패하면 추가 결제 없이 다시 분석할 수 있어요.</p>
        </aside>
      </div>
    </div>
  );
}
