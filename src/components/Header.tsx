import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import Logo from "@/components/Logo";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" aria-label="스윙체크 홈">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          {user ? (
            <>
              <Link href="/upload" className="hidden rounded-full px-3 py-2 text-foreground/80 sm:inline-block transition hover:bg-white/5 hover:text-foreground">
                스윙 분석
              </Link>
              <Link href="/mypage" className="rounded-full px-3 py-2 text-foreground/80 transition hover:bg-white/5 hover:text-foreground">
                내 분석
              </Link>
              <form action={signOut}>
                <button type="submit" className="rounded-full px-3 py-2 text-muted transition hover:text-foreground">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 text-foreground/80 transition hover:text-foreground">
                로그인
              </Link>
              <Link href="/signup" className="btn px-4 py-2 text-sm">
                시작하기
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
