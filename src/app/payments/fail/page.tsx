import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StatusCard from "@/components/StatusCard";

export default async function PaymentFailPage({ searchParams }: PageProps<"/payments/fail">) {
  const { code, message, orderId } = await searchParams;

  let retryHref = "/upload";
  if (typeof orderId === "string") {
    const supabase = await createClient();
    const { data } = await supabase.from("analyses").select("id").eq("order_id", orderId).maybeSingle();
    if (data) retryHref = `/analyses/${data.id}/checkout`;
  }

  return (
    <StatusCard
      icon="×"
      tone="danger"
      title="결제가 취소되었거나 실패했어요"
      action={
        <Link href={retryHref} className="btn">
          다시 결제하기
        </Link>
      }
    >
      <p>{typeof message === "string" ? message : "다시 시도해 주세요."}</p>
      {typeof code === "string" && <p className="mt-2 text-xs">오류 코드: {code}</p>}
    </StatusCard>
  );
}
