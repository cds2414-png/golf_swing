import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 로그인 쿠키를 매 요청 읽는 앱이라 Cache Components 대신 일반 동적 렌더링을 쓴다.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
