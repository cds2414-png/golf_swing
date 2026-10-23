import "server-only";
import OpenAI from "openai";
import { CLUBS, PHASE_LABELS, ageGroupLabel, type ClubType, type SwingAnalysisResult } from "@/lib/golf";

// 캡처 프레임 위에 문제 위치를 표시하기 위한 마커. 좌표는 이미지 기준 0~1 비율.
const MARKERS_SCHEMA = {
  type: "array",
  description: "frame_index 이미지에서 문제가 보이는 신체·클럽 부위 0~3개. 문제 없으면 빈 배열",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["x", "y", "label"],
    properties: {
      x: { type: "number", description: "가로 위치(왼쪽 0 ~ 오른쪽 1)" },
      y: { type: "number", description: "세로 위치(위 0 ~ 아래 1)" },
      label: { type: "string", description: "짧은 표시 문구(예: 머리 앞으로 나감, 왼무릎 펴짐) 12자 이내" },
    },
  },
} as const;

const FRAME_INDEX_SCHEMA = {
  type: "integer",
  description: "근거가 가장 잘 보이는 프레임 번호(#0부터). 판단할 프레임이 없으면 -1",
} as const;

const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "is_golf_swing",
    "overall_score",
    "summary",
    "swing_phases",
    "pro_comparison",
    "key_weaknesses",
    "drills",
    "age_considerations",
    "video_quality_note",
  ],
  properties: {
    is_golf_swing: {
      type: "boolean",
      description: "실제 사람이 골프 스윙하는 실사 촬영 영상인지. 그림·애니메이션·막대 인형·게임 화면이면 false",
    },
    overall_score: { type: "integer", description: "0~100, 같은 연령대 아마추어 기준이 아닌 프로 대비 점수" },
    summary: { type: "string", description: "전체 스윙 총평 3~4문장" },
    swing_phases: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["phase", "score", "frame_index", "markers", "observation", "pro_standard", "improvement"],
        properties: {
          phase: { type: "string", enum: Object.keys(PHASE_LABELS) },
          frame_index: FRAME_INDEX_SCHEMA,
          markers: MARKERS_SCHEMA,
          score: { type: "integer", description: "0~100" },
          observation: { type: "string", description: "프레임에서 관찰한 사용자 동작" },
          pro_standard: { type: "string", description: "이 구간에서 프로 선수의 일반적인 동작" },
          improvement: { type: "string", description: "구체적인 개선 방법" },
        },
      },
    },
    pro_comparison: {
      type: "array",
      description: "프로 대비 비교 항목 4~6개 (어깨 회전, 힙 회전, 척추각 유지, 템포, 체중 이동 등)",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["metric", "user_estimate", "pro_benchmark", "gap_level"],
        properties: {
          metric: { type: "string" },
          user_estimate: { type: "string", description: "영상 기반 추정치(예: 약 70도)" },
          pro_benchmark: { type: "string", description: "프로 평균 기준치(예: 90~100도)" },
          gap_level: { type: "string", enum: ["small", "medium", "large"] },
        },
      },
    },
    key_weaknesses: {
      type: "array",
      description: "프로 대비 부족한 점 3개 내외, priority 1이 가장 중요",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "priority", "frame_index", "markers"],
        properties: {
          frame_index: FRAME_INDEX_SCHEMA,
          markers: MARKERS_SCHEMA,
          title: { type: "string" },
          detail: { type: "string" },
          priority: { type: "integer" },
        },
      },
    },
    drills: {
      type: "array",
      description: "부족한 점을 보완할 연습 드릴 2~4개",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "how_to", "reps"],
        properties: {
          name: { type: "string" },
          how_to: { type: "string" },
          reps: { type: "string", description: "권장 횟수·빈도" },
        },
      },
    },
    age_considerations: { type: "string", description: "연령대를 고려한 현실적인 목표와 주의점" },
    video_quality_note: { type: "string", description: "촬영 각도·화질로 인한 분석 한계. 없으면 빈 문자열" },
  },
} as const;

export interface SwingInput {
  clubType: ClubType;
  age: number | null;
  gender: string | null;
  handedness: string;
  videoDuration: number | null;
  // data:image/jpeg;base64,... 형식, 시간 순서대로
  frames: { dataUrl: string; time: number }[];
}

function buildInstructions() {
  return [
    "당신은 PGA·KLPGA 투어 선수를 지도해 온 20년 경력의 골프 스윙 코치입니다.",
    "사용자가 촬영한 8초 이하 스윙 영상에서 시간 순으로 추출한 프레임을 보고 스윙을 분석합니다.",
    "규칙:",
    "- 반드시 한국어로, 아마추어가 이해할 수 있는 쉬운 말로 씁니다.",
    "- 프레임에서 실제로 보이는 것만 근거로 판단하고, 보이지 않는 부분은 추정이라고 밝힙니다.",
    "- 같은 골프채를 쓰는 투어 프로 선수의 일반적인 수치·동작과 비교해 부족한 점을 구체적으로 짚습니다.",
    "- 연령대에 따라 유연성·근력·회복력이 다르므로, 프로 기준을 그대로 강요하지 말고 그 연령에 맞는 현실적인 목표를 제시합니다.",
    "  (예: 60대 이상은 어깨 회전 목표를 줄이고 부상 위험이 낮은 동작을 권장, 주니어는 기본기와 성장 단계 고려)",
    "- 먼저 실제 사람이 골프 스윙하는 실사 촬영 영상인지 판별합니다. 그림, 애니메이션, 막대 인형, 3D 렌더링, 게임 화면,",
    "  사람이 없거나 골프가 아닌 동작이면 스윙 모양이 비슷해도 is_golf_swing을 false로 합니다. 이때는 추정 분석을 하지 않습니다.",
    "- is_golf_swing이 false이면 overall_score와 모든 score는 0, summary에는 분석할 수 없는 이유와 다시 찍는 방법을 2~3문장으로 쓰고,",
    "  swing_phases·pro_comparison·key_weaknesses·drills는 빈 배열, age_considerations와 video_quality_note는 빈 문자열로 둡니다.",
    "- swing_phases는 어드레스부터 피니시까지 6개 구간을 모두 포함합니다. 퍼터라면 구간 의미를 퍼팅 스트로크에 맞게 해석합니다.",
    "- 각 이미지 앞에 \"프레임 #번호\"가 붙어 있습니다. swing_phases와 key_weaknesses마다 근거가 가장 잘 보이는 프레임 번호를 frame_index에 적습니다.",
    "- markers에는 그 프레임에서 문제가 되는 부위(머리, 어깨, 골반, 무릎, 손, 클럽헤드, 공 등)의 위치를 이미지 비율 좌표로 찍습니다.",
    "  x는 왼쪽 0 ~ 오른쪽 1, y는 위 0 ~ 아래 1입니다. 부위의 중심을 최대한 정확히 가리키고, 잘 된 구간은 markers를 비워 둡니다.",
  ].join("\n");
}

function buildUserText(input: SwingInput) {
  const club = CLUBS[input.clubType];
  const genderText = input.gender === "male" ? "남성" : input.gender === "female" ? "여성" : "미입력";
  return [
    `골프채: ${club.label}`,
    `이 클럽의 핵심 체크 포인트: ${club.focus}`,
    `나이: ${input.age ?? "미입력"}세 (${ageGroupLabel(input.age)})`,
    `성별: ${genderText}`,
    `타석: ${input.handedness === "left" ? "왼손잡이" : "오른손잡이"}`,
    `영상 길이: ${input.videoDuration ?? "?"}초, 프레임 ${input.frames.length}장`,
    `프레임 시각(초): ${input.frames.map((f) => f.time.toFixed(2)).join(", ")}`,
    "위 정보를 바탕으로 이 사용자의 스윙을 프로 선수와 비교 분석해 주세요.",
  ].join("\n");
}

export async function analyzeSwing(input: SwingInput): Promise<SwingAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.5",
    instructions: buildInstructions(),
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: buildUserText(input) },
          // 각 이미지 앞에 번호를 붙여 AI가 frame_index로 가리킬 수 있게 한다.
          ...input.frames.flatMap((f, i) => [
            { type: "input_text" as const, text: `프레임 #${i} (${f.time.toFixed(2)}초)` },
            { type: "input_image" as const, image_url: f.dataUrl, detail: "auto" as const },
          ]),
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "swing_analysis",
        strict: true,
        schema: RESULT_SCHEMA as unknown as Record<string, unknown>,
      },
    },
  });

  const text = response.output_text;
  if (!text) throw new Error("AI 응답이 비어 있습니다.");
  return JSON.parse(text) as SwingAnalysisResult;
}
