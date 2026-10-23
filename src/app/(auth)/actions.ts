"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
  // React 19는 액션 후 폼을 초기화하므로, 실패 시 입력값을 돌려줘 다시 채운다(비밀번호 제외).
  values?: Record<string, string>;
}

function fail(error: string, formData: FormData, keys: string[]): AuthState {
  return { error, values: Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")])) };
}

const SIGNUP_KEYS = ["name", "email", "birthYear", "gender", "handedness"];

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
    if (error.code === "email_not_confirmed") {
      return fail("이메일 인증이 아직 안 됐어요. 받은 메일의 링크를 눌러 주세요.", formData, ["email"]);
    }
    return fail("이메일 또는 비밀번호가 올바르지 않습니다.", formData, ["email"]);
  }

  redirect(safeNext(formData.get("next")));
}

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const birthYear = Number(formData.get("birthYear"));
  const gender = String(formData.get("gender") ?? "");
  const handedness = String(formData.get("handedness") ?? "right");

  const thisYear = new Date().getFullYear();
  if (!email || !name) return fail("이름과 이메일을 입력해 주세요.", formData, SIGNUP_KEYS);
  if (password.length < 8) return fail("비밀번호는 8자 이상이어야 합니다.", formData, SIGNUP_KEYS);
  if (password !== passwordConfirm) return fail("비밀번호 확인이 일치하지 않습니다.", formData, SIGNUP_KEYS);
  if (!Number.isInteger(birthYear) || birthYear < 1920 || birthYear > thisYear - 5) {
    return fail("출생 연도를 올바르게 입력해 주세요. 연령별 분석에 사용됩니다.", formData, SIGNUP_KEYS);
  }
  if (!["male", "female", "other"].includes(gender)) return fail("성별을 선택해 주세요.", formData, SIGNUP_KEYS);
  if (!["right", "left"].includes(handedness)) return fail("타석 방향을 선택해 주세요.", formData, SIGNUP_KEYS);

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/upload`,
      data: { name, birth_year: String(birthYear), gender, handedness },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") return fail("이미 가입된 이메일입니다.", formData, SIGNUP_KEYS);
    if (error.code === "email_address_invalid") return fail("사용할 수 없는 이메일 주소예요.", formData, SIGNUP_KEYS);
    if (error.code === "over_email_send_rate_limit") {
      return fail("가입 요청이 많아 인증 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.", formData, SIGNUP_KEYS);
    }
    return fail(`회원가입에 실패했어요: ${error.message}`, formData, SIGNUP_KEYS);
  }

  // 이메일 인증이 꺼져 있으면 바로 세션이 생긴다.
  if (data.session) redirect("/upload");
  return { message: "가입 확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료됩니다." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
