import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { confirmTossPayment } from "@/lib/toss";
import StatusCard from "@/components/StatusCard";

function ErrorBox({ message, analysisId }: { message: string; analysisId?: string }) {
  return (
    <StatusCard
      icon="!"
      tone="danger"
      title="결제를 완료하지 못했어요"
      action={
        <Link href={analysisId ? `/analyses/${analysisId}/checkout` : "/mypage"} className="btn">
          다시 시도하기
        </Link>
      }
    >
      {message}
    </StatusCard>
  );
}

// 토스 결제창에서 돌아오면 금액을 검증한 뒤 결제 승인 API를 호출한다.
export default async function PaymentSuccessPage({ searchParams }: PageProps<"/payments/success">) {
  const { paymentKey, orderId, amount } = await searchParams;
  if (typeof paymentKey !== "string" || typeof orderId !== "string" || typeof amount !== "string") {
    return <ErrorBox message="결제 정보가 올바르지 않아요." />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: analysis } = await supabase
    .from("analyses")
    .select("id, amount, status")
    .eq("order_id", orderId)
    .maybeSingle();
  if (!analysis) return <ErrorBox message="주문을 찾을 수 없어요." />;

  // 새로고침 등으로 다시 들어온 경우 이미 처리된 결제는 결과 화면으로 보낸다.
  if (analysis.status !== "pending_payment") redirect(`/analyses/${analysis.id}`);

  // 결제창에서 넘어온 금액이 서버에 저장된 금액과 다르면 승인하지 않는다(금액 위변조 방지).
  if (Number(amount) !== analysis.amount) {
    return <ErrorBox message="결제 금액이 주문 금액과 달라 결제를 승인하지 않았어요." analysisId={analysis.id} />;
  }

  const result = await confirmTossPayment(paymentKey, orderId, analysis.amount);
  if (!result.ok && result.code !== "ALREADY_PROCESSED_PAYMENT") {
    return <ErrorBox message={result.message ?? "결제 승인에 실패했어요."} analysisId={analysis.id} />;
  }

  const admin = createAdminClient();
  await admin
    .from("analyses")
    .update({ status: "paid", payment_key: paymentKey, paid_at: new Date().toISOString() })
    .eq("id", analysis.id)
    .eq("status", "pending_payment");

  redirect(`/analyses/${analysis.id}`);
}
