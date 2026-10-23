import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import Header from "@/components/Header";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "스윙체크 · AI 골프 스윙 분석",
  description: "8초 스윙 영상으로 프로 선수 대비 부족한 점을 AI가 분석해 드립니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${playfair.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="display text-lg text-foreground">
                Swing<span className="italic text-gold">Check</span>
              </div>
              <p className="mt-1">AI 분석 결과는 참고용이며, 정확한 교정은 전문 코치와 함께하세요.</p>
            </div>
            <div className="flex gap-5">
              <Link href="/upload" className="hover:text-foreground">
                스윙 분석
              </Link>
              <Link href="/mypage" className="hover:text-foreground">
                내 분석
              </Link>
              <span>© 2026 SwingCheck</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
