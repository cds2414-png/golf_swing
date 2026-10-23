import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;

  return (
    <AuthShell eyebrow="Welcome back" title="로그인" subtitle="지난 분석 리포트와 새 스윙 분석을 이어서 하세요">
      <div className="card">
        {error === "auth" && (
          <p className="alert-error mb-5">인증 링크가 만료됐거나 올바르지 않아요. 다시 로그인해 주세요.</p>
        )}
        <LoginForm next={typeof next === "string" ? next : "/upload"} />
        <p className="mt-6 text-center text-sm text-muted">
          아직 회원이 아니신가요?{" "}
          <Link href="/signup" className="font-semibold text-gold hover:text-gold-strong">
            회원가입
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
