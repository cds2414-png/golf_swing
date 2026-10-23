// 결제 실패·분석 진행 등 상태 안내용 카드
const TONES = {
  gold: "border-gold/40 text-gold bg-gold-soft",
  danger: "border-danger/40 text-danger bg-danger-soft",
  brand: "border-brand/40 text-brand bg-brand-soft",
} as const;

export default function StatusCard({
  icon,
  tone = "gold",
  title,
  children,
  action,
}: {
  icon: React.ReactNode;
  tone?: keyof typeof TONES;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card mx-auto max-w-lg py-12 text-center">
      <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border text-2xl ${TONES[tone]}`}>
        {icon}
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {children && <div className="mx-auto mt-3 max-w-sm leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
