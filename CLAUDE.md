# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 개요

스윙체크(SwingCheck): 사용자가 올린 8초 이하 골프 스윙 영상을 골프채 종류·연령에 맞춰 AI(OpenAI)로 분석하고, 프로 선수 대비 부족한 점을 리포트로 보여 주는 유료 서비스. Next.js 16(App Router) + Supabase + 토스페이먼츠 + OpenAI. 사용자에게 보이는 문구와 코드 주석은 한국어로 쓴다.

- 운영: https://golf-swing-orpin.vercel.app (Vercel 프로젝트 `golf-swing`, GitHub 자동 배포 미연결)
- Supabase 프로젝트: `golf-swing-checking` (ref `hrbabpjsbinbbbhzviua`, 서울 리전) — 로컬과 운영이 같은 DB를 쓴다

## 명령어

```bash
npm run dev            # 개발 서버 (http://localhost:3000)
npm run build          # 프로덕션 빌드 (타입 검사 포함)
npm run lint           # ESLint
npx tsc --noEmit       # 타입 검사만
npx next typegen       # 라우트를 추가·삭제한 뒤 PageProps/RouteContext 타입 재생성
npx vercel deploy --prod   # 운영 배포 (아래 Windows 주의 참고)
```

테스트 프레임워크는 없다. 기능 확인은 브라우저로 실제 흐름(가입 → 업로드 → 결제 → 분석)을 돌려서 한다.

## Next.js 16 주의점

- `middleware.ts`가 아니라 `src/proxy.ts`(`export function proxy`)를 쓴다. 세션 갱신과 보호 경로(`/upload`, `/mypage`, `/analyses`, `/payments`) 로그인 리다이렉트를 담당한다.
- `params`, `searchParams`, `cookies()`는 모두 `await` 해야 한다. 페이지는 `PageProps<"/경로">`, 라우트 핸들러는 `RouteContext<"/경로">` 전역 타입을 쓴다.
- `next.config.ts`에서 `cacheComponents: false`로 껐다(매 요청 인증 쿠키를 읽는 앱이라 일반 동적 렌더링 사용).
- 개발 서버가 CSS 변경을 반영하지 않고 옛 스타일을 계속 내보낸 적이 있다. 스타일이 안 바뀌면 개발 서버를 재시작한다.

## 아키텍처

### 핵심 흐름과 상태 머신

`analyses` 테이블 한 행이 주문이자 분석 작업이다. `status`: `pending_payment` → `paid` → `analyzing` → `completed` | `failed`.

1. **업로드** (`src/app/upload/UploadForm.tsx`, `src/lib/video-frames.ts`): 브라우저에서 영상 길이를 검사하고 `<canvas>`로 프레임 `FRAME_COUNT`장을 JPEG로 뽑는다. 영상과 프레임은 클라이언트가 Supabase Storage에 **직접** 올린다(경로 `{user_id}/{uploadId}/swing.mp4`, `frame_00_0.00.jpg` — 파일명 끝 숫자가 프레임 시각(초)이며 서버가 정규식으로 다시 읽는다).
2. **주문 생성** (`POST /api/analyses`): 경로가 본인 폴더인지, 길이·프레임 수를 검증하고 금액은 **서버 요금표**(`CLUBS[club].price`)로 정한다. `order_id`가 토스 주문번호.
3. **결제** (`analyses/[id]/checkout`): 토스 결제위젯 v2. 개발 모드 StrictMode에서 위젯이 두 번 렌더링되면 토스가 오류를 내므로 초기화 promise를 `useRef`에 보관해 한 번만 실행한다.
4. **결제 승인** (`src/app/payments/success/page.tsx`, 서버 컴포넌트): 쿼리 `amount`를 DB 금액과 비교한 뒤 `src/lib/toss.ts`로 승인 API 호출 → `status='paid'`. 이미 처리된 주문이면 결과 화면으로 보낸다.
5. **분석** (`POST /api/analyses/[id]/run`, `maxDuration=300`): 결과 화면의 `AnalysisRunner`가 `paid` 상태일 때 호출. `paid|failed → analyzing` 조건부 update로 중복 실행을 막는다(`failed`는 추가 결제 없이 재시도 가능). 프레임을 Storage에서 받아 base64로 OpenAI에 보낸다.
6. **리포트** (`analyses/[id]/page.tsx`, `Report.tsx`): 완료된 분석은 프레임 서명 URL을 만들어 `AnnotatedFrame`으로 캡처 이미지 위에 문제 위치 마커를 그린다.

### 권한 모델

- 사용자 권한 클라이언트 `createClient()`(`src/lib/supabase/server.ts`)는 RLS 적용 — `profiles`, `analyses`는 본인 행 **조회만** 가능.
- 모든 쓰기(주문 생성, 결제 상태 변경, 분석 결과 저장, 회원 생성)는 `createAdminClient()`(secret key, RLS 우회)로 서버에서만 한다. 클라이언트에 쓰기 정책을 추가하지 말 것 — 금액·상태 위변조가 가능해진다.
- Storage `swing-videos` 버킷은 비공개, 첫 폴더가 `auth.uid()`인 객체만 업로드·조회 가능. 영상/프레임은 서명 URL로만 보여 준다.

### 회원가입

메일 인증이 없다. `signup` 서버 액션이 `auth.admin.createUser({ email_confirm: true, user_metadata })`로 인증 완료 계정을 만들고 곧바로 `signInWithPassword`한다. `profiles` 행은 DB 트리거 `handle_new_user()`가 `user_metadata`(`name`, `birth_year`, `handedness`)로 만든다. React 19는 폼 액션 후 입력값을 초기화하므로 실패 시 `AuthState.values`로 돌려줘 `defaultValue`로 다시 채운다(select·radio는 `key`를 바꿔 재마운트해야 반영됨).

### AI 분석 (`src/lib/analyze-swing.ts`)

- OpenAI Responses API + Structured Outputs(`strict: true` JSON 스키마). 모델은 `OPENAI_MODEL`(기본 `gpt-5.5`).
- 스키마를 바꾸면 strict 규칙상 모든 속성을 `required`에 넣고 `additionalProperties: false`를 유지해야 한다. `src/lib/golf.ts`의 `SwingAnalysisResult` 타입도 함께 고친다. 이미 DB에 저장된 옛 결과가 새 필드 없이도 렌더링되도록 새 필드는 타입에서 optional로 둔다.
- 각 이미지 앞에 `프레임 #i (t초)` 텍스트를 끼워 AI가 `frame_index`로 프레임을 지목하고, `markers`(이미지 기준 0~1 좌표 + 라벨)로 문제 부위를 표시한다.
- 실사 사람 영상이 아니면(그림·막대 인형 등) `is_golf_swing=false`, 점수 0, 상세 배열은 비운다. 리포트·마이페이지는 이 경우 "스윙 인식 불가"로 표시한다.

### 설정값 한곳

`src/lib/golf.ts`: 골프채별 요금·체크 포인트(`CLUBS`), `MAX_VIDEO_SECONDS`(8), `FRAME_COUNT`(20), `FRAME_MAX_WIDTH`, 상태·구간 라벨. 영상 길이를 바꿀 때는 이 상수 외에도 하드코딩된 "N초" 문구(`layout.tsx` 메타 설명, `analyze-swing.ts` 프롬프트, README)를 함께 고친다.

### 디자인 시스템

다크 테마 단일(딥 그린 + 샴페인 골드). 색은 `src/app/globals.css`의 CSS 변수 → Tailwind v4 `@theme inline` 토큰(`bg-surface`, `text-gold`, `border-border-strong` 등). 공통 클래스: `.card`, `.card-soft`, `.btn`, `.btn-outline`, `.input`, `.eyebrow`, `.display`(Playfair Display), `.text-gold-gradient`, `.alert-error`. 토스 위젯은 흰 배경 기준이라 흰 패널 안에 렌더링한다.

## 환경 변수

`.env.local`(커밋 금지, `.env.example` 참고): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`. 같은 7개가 Vercel Production·Preview에 등록돼 있다(`NEXT_PUBLIC_TOSS_CLIENT_KEY`는 Vercel이 민감값으로 오인하므로 `--type config`로 등록). 토스 키는 현재 개발자센터 문서용 공개 테스트 키.

## DB 변경

스키마는 `supabase/migrations/`에 SQL로 기록한다. 원격 적용은 Supabase MCP `apply_migration`(프로젝트 ref `hrbabpjsbinbbbhzviua`)으로 하고, 적용 후 `get_advisors`(security)로 RLS·SECURITY DEFINER 경고를 확인한다(트리거 함수는 `anon`/`authenticated` 실행 권한을 회수해 둠).

## Windows 환경 주의

PC 이름에 한글이 있으면 Vercel CLI가 `Cannot convert argument to a ByteString` 오류로 실패한다. `os.hostname()`/`os.userInfo().username`을 영문으로 덮어쓰는 스크립트를 만들어 `NODE_OPTIONS="--require <스크립트경로>"`로 미리 불러온 뒤 `vercel` 명령을 실행한다.

## 테스트 계정과 결제 테스트

- 로컬 테스트 계정 정보는 `.env.test.local`(gitignore 대상)에 있다.
- 토스 샌드박스 카드 결제는 카드사 앱 인증이 필요해 자동화가 안 된다. 분석 단계만 확인할 때는 테스트 주문을 SQL로 `status='paid', payment_key='MANUAL_TEST_NO_TOSS'`로 바꾸고 결과 화면을 연다(실제 결제와 구분용 표시).
