// 골프채 종류·가격·분석 관련 공통 상수

export const CLUBS = {
  driver: { label: "드라이버", price: 4900, focus: "어퍼 블로 임팩트, 넓은 아크, 체중 이동과 꼬임(X-factor)" },
  wood: { label: "페어웨이 우드", price: 4900, focus: "쓸어 치는 스윙, 낮고 긴 테이크어웨이, 균형 잡힌 피니시" },
  hybrid: { label: "하이브리드", price: 4900, focus: "아이언과 우드 사이의 완만한 다운블로, 안정된 하체" },
  iron: { label: "아이언", price: 4900, focus: "다운블로 임팩트, 핸드 퍼스트, 볼 먼저 맞히기, 체중 왼발 이동" },
  wedge: { label: "웨지", price: 3900, focus: "짧은 거리 컨트롤, 리듬, 하체 안정, 일정한 스윙 크기" },
  putter: { label: "퍼터", price: 2900, focus: "어깨 시계추 동작, 머리·하체 고정, 페이스 직각 유지, 템포" },
} as const;

export type ClubType = keyof typeof CLUBS;

export function isClubType(value: unknown): value is ClubType {
  return typeof value === "string" && value in CLUBS;
}

export const MAX_VIDEO_SECONDS = 7;
export const FRAME_COUNT = 20;
export const FRAME_MAX_WIDTH = 640;

export function ageFromBirthYear(birthYear: number | null | undefined, now = new Date()) {
  if (!birthYear) return null;
  return now.getFullYear() - birthYear;
}

export function ageGroupLabel(age: number | null) {
  if (age === null) return "연령 미입력";
  if (age < 20) return "주니어(10대)";
  if (age < 60) return `${Math.floor(age / 10) * 10}대`;
  return "60대 이상 시니어";
}

export const STATUS_LABELS = {
  pending_payment: "결제 대기",
  paid: "결제 완료",
  analyzing: "분석 중",
  completed: "분석 완료",
  failed: "분석 실패",
} as const;

export type AnalysisStatus = keyof typeof STATUS_LABELS;

export const PHASE_LABELS = {
  address: "어드레스",
  takeaway: "테이크어웨이",
  backswing_top: "백스윙 탑",
  downswing: "다운스윙",
  impact: "임팩트",
  follow_through: "팔로스루·피니시",
} as const;

export type SwingPhase = keyof typeof PHASE_LABELS;

export interface SwingAnalysisResult {
  is_golf_swing: boolean;
  overall_score: number;
  summary: string;
  swing_phases: {
    phase: SwingPhase;
    score: number;
    observation: string;
    pro_standard: string;
    improvement: string;
  }[];
  pro_comparison: {
    metric: string;
    user_estimate: string;
    pro_benchmark: string;
    gap_level: "small" | "medium" | "large";
  }[];
  key_weaknesses: { title: string; detail: string; priority: number }[];
  drills: { name: string; how_to: string; reps: string }[];
  age_considerations: string;
  video_quality_note: string;
}

export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}
