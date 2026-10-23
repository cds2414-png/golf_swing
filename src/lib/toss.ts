import "server-only";

export interface TossConfirmResult {
  ok: boolean;
  code?: string;
  message?: string;
}

// 토스페이먼츠 결제 승인 API 호출
export async function confirmTossPayment(paymentKey: string, orderId: string, amount: number): Promise<TossConfirmResult> {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("TOSS_SECRET_KEY 환경 변수가 설정되지 않았습니다.");

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      // 같은 결제를 두 번 승인하지 않도록 멱등키를 건다.
      "Idempotency-Key": `confirm-${orderId}`,
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
    cache: "no-store",
  });

  if (res.ok) return { ok: true };
  const body = await res.json().catch(() => ({}));
  return { ok: false, code: body.code, message: body.message };
}
