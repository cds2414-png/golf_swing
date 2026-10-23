# 스윙체크 - AI 골프 스윙 분석

8초 이하 스윙 영상을 올리면, 골프채 종류와 연령을 고려해 프로 선수 대비 부족한 점을 AI(OpenAI)가 분석해 주는 서비스입니다.

## 기술 스택

- Next.js 16 (App Router, `src/proxy.ts`로 세션 갱신·로그인 보호)
- Supabase: Auth(이메일 회원가입·로그인), Postgres(`profiles`, `analyses`), Storage(`swing-videos` 비공개 버킷)
- 토스페이먼츠 결제위젯 SDK v2 + 결제 승인 API
- OpenAI Responses API (프레임 이미지 + Structured Outputs)

## 시작하기

1. `.env.local`에 빈 값을 채웁니다.
   - `SUPABASE_SECRET_KEY`: Supabase 대시보드 > Project Settings > API Keys 의 secret key (`sb_secret_...`)
   - `OPENAI_API_KEY`: OpenAI API 키
   - 토스 키는 개발자센터 문서용 공개 테스트 키가 들어 있어요. 내 상점 키로 바꾸려면 토스페이먼츠 개발자센터의 **결제위젯 연동 키**를 넣으세요.
2. `npm install` 후 `npm run dev` → http://localhost:3000

## 흐름

1. 회원가입(이름·이메일·비밀번호·출생 연도·타석) → 메일 인증 없이 서버에서 인증 완료 계정 생성(`auth.admin.createUser`) 후 바로 로그인
2. `/upload`: 골프채 선택, 영상 선택(브라우저에서 8초 초과 시 거절), 프레임 20장 추출 → Storage 업로드 → `POST /api/analyses`로 결제 대기 주문 생성(금액은 서버 요금표 기준)
3. `/analyses/[id]/checkout`: 토스 결제위젯 → `/payments/success`에서 금액 검증 후 결제 승인
4. `/analyses/[id]`: `POST /api/analyses/[id]/run`으로 GPT 분석 → 결과 리포트(종합 점수, 프로 대비 부족한 점, 비교표, 구간별 분석, 연령 맞춤 조언, 연습 드릴)

## 참고

- DB 스키마: `supabase/migrations/20261023000000_init_golf_swing.sql`
- 요금·클럽 설정: `src/lib/golf.ts`, 분석 프롬프트: `src/lib/analyze-swing.ts`
- 아이폰 HEVC(.mov) 영상은 Windows 크롬에서 디코딩이 안 될 수 있어요. 이 경우 MP4(H.264)로 올려야 합니다.

## 배포 (Vercel)

- 운영 주소: https://golf-swing-orpin.vercel.app (Vercel 프로젝트 `golf-swing`)
- 환경 변수 7개(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`)는 Vercel의 Production·Preview에 등록되어 있어요.
- 재배포: `npx vercel deploy --prod`
- GitHub 자동 배포는 아직 연결되지 않았어요. Vercel 대시보드 > Project > Settings > Git 에서 `cds2414-png/golf_swing`을 연결하면 `main`에 푸시할 때마다 자동 배포돼요.
- PC 이름에 한글이 있으면 Vercel CLI가 `Cannot convert argument to a ByteString` 오류로 실패해요. 이때는 `os.hostname()`을 영문으로 바꾸는 스크립트를 `NODE_OPTIONS="--require <스크립트>"`로 미리 불러온 뒤 실행하세요.
