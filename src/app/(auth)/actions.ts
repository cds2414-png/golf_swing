"use server";

import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  // React 19는 액션 후 폼을 초기화하므로, 실패 시 입력값을 돌려줘 다시 채운다(비밀번호 제외).
  values?: Record<string, string>;
}

function fail(error: string, formData: FormData, keys: string[]): AuthState {
  return { error, values: Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")])) };
}

const SIGNUP_KEYS = ["name", "email", "birthYear", "handedness"];

// 외부 사이트로 보내는 오픈 리다이렉트를 막는다.
function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/upload";
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return fail("이메일과 비밀번호를 입력해 주세요.", formData, ["email"]);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return fail("이메일 또는 비밀번호가 올바르지 않습니다.", formData, ["email"]);
  }

  redirect(safeNext(formData.get("next")));
}

// 메일 인증 없이 바로 가입한다. 서버에서 인증 완료 상태로 계정을 만든 뒤 곧바로 로그인시킨다.
export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const birthYear = Number(formData.get("birthYear"));
  const handedness = String(formData.get("handedness") ?? "right");

  const thisYear = new Date().getFullYear();
  if (!name) return fail("이름을 입력해 주세요.", formData, SIGNUP_KEYS);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("이메일 주소를 확인해 주세요.", formData, SIGNUP_KEYS);
  if (password.length < 8) return fail("비밀번호는 8자 이상이어야 합니다.", formData, SIGNUP_KEYS);
  if (!Number.isInteger(birthYear) || birthYear < 1920 || birthYear > thisYear - 5) {
    return fail("출생 연도를 올바르게 입력해 주세요. 연령별 분석에 사용됩니다.", formData, SIGNUP_KEYS);
  }
  if (!["right", "left"].includes(handedness)) return fail("타석 방향을 선택해 주세요.", formData, SIGNUP_KEYS);

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // profiles 트리거가 이 값으로 프로필을 만든다.
    user_metadata: { name, birth_year: String(birthYear), handedness },
  });
  if (createError) {
    if (createError.code === "weak_password") return fail("더 안전한 비밀번호를 사용해 주세요.", formData, SIGNUP_KEYS);
    if (createError.code === "email_exists") {
      return fail("이미 가입된 이메일이에요. 로그인해 주세요.", formData, SIGNUP_KEYS);
    }
    return fail(`회원가입에 실패했어요: ${createError.message}`, formData, SIGNUP_KEYS);
  }

  const supabase = await createClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) return fail("가입은 됐지만 로그인에 실패했어요. 로그인 화면에서 다시 시도해 주세요.", formData, SIGNUP_KEYS);

  redirect("/upload");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
