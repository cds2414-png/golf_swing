"use client";

import { loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useEffect, useRef, useState } from "react";
import { formatWon } from "@/lib/golf";

interface Props {
  clientKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
}

export default function CheckoutWidget(props: Props) {
  const { clientKey, customerKey, amount } = props;
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 결제수단 위젯은 한 번만 렌더링할 수 있다. 개발 모드(StrictMode)에서 effect가 두 번 실행돼도
  // 초기화는 한 번만 하도록 ref에 promise를 보관한다.
  const initRef = useRef<Promise<TossPaymentsWidgets> | null>(null);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = (async () => {
        const tossPayments = await loadTossPayments(clientKey);
        const w = tossPayments.widgets({ customerKey });
        await w.setAmount({ currency: "KRW", value: amount });
        await Promise.all([
          w.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
          w.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
        ]);
        return w;
      })();
    }

    let active = true;
    initRef.current
      .then((w) => {
        if (!active) return;
        setWidgets(w);
        setReady(true);
      })
      .catch((err) => {
        if (active) setError(`결제 위젯을 불러오지 못했어요: ${(err as Error).message}`);
      });
    return () => {
      active = false;
    };
  }, [clientKey, customerKey, amount]);

  async function handlePay() {
    if (!widgets) return;
    setError(null);
    try {
      await widgets.requestPayment({
        orderId: props.orderId,
        orderName: props.orderName,
        customerEmail: props.customerEmail,
        customerName: props.customerName,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code !== "USER_CANCEL") setError(e.message ?? "결제 요청에 실패했어요.");
    }
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">결제 수단</h2>
        <span className="text-xs text-muted">토스페이먼츠 안전결제</span>
      </div>
      {/* 토스 위젯은 흰 배경 기준으로 그려지므로 밝은 패널 위에 둔다 */}
      <div className="min-h-40 overflow-hidden rounded-2xl bg-white py-2">
        <div id="payment-method" />
        <div id="agreement" />
      </div>
      {error && <p className="alert-error">{error}</p>}
      <button type="button" onClick={handlePay} disabled={!ready} className="btn w-full py-4 text-base">
        {ready ? `${formatWon(amount)} 결제하기` : "결제 수단 불러오는 중..."}
      </button>
    </div>
  );
}
