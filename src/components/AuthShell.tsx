import { LogoMark } from "@/components/Logo";

// 로그인·회원가입 공통 레이아웃
export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md py-4">
      <div className="mb-8 text-center">
        <LogoMark className="mx-auto mb-5 h-12 w-12" />
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
