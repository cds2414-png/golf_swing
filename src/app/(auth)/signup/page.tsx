"use client";

import Link from "next/link";
import { useActionState } from "react";
import AuthShell from "@/components/AuthShell";
import { signup, type AuthState } from "../actions";

const thisYear = new Date().getFullYear();

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, {});

  const v = state.values;

  if (state.message) {
    return (
      <AuthShell eyebrow="Almost there" title="메일을 확인해 주세요" subtitle="한 단계만 남았어요">
        <div className="card text-center">
          <p className="text-muted">{state.message}</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Join SwingCheck" title="회원가입" subtitle="나이와 타석 정보로 나에게 맞춘 분석을 받아요">
      <form action={action} className="card space-y-5">
        <div>
          <label className="label" htmlFor="name">
            이름
          </label>
          <input id="name" name="name" required defaultValue={v?.name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            이메일
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required defaultValue={v?.email} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="password">
              비밀번호 (8자 이상)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="passwordConfirm">
              비밀번호 확인
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="birthYear">
            출생 연도 <span className="font-normal text-muted">(연령별 분석에 사용)</span>
          </label>
          <input
            id="birthYear"
            name="birthYear"
            type="number"
            min={1920}
            max={thisYear - 5}
            placeholder="예: 1985"
            required
            defaultValue={v?.birthYear}
            className="input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="gender">
              성별
            </label>
            <select key={`g-${v?.gender}`} id="gender" name="gender" required defaultValue={v?.gender ?? ""} className="input">
              <option value="" disabled>
                선택
              </option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="handedness">
              타석
            </label>
            <select key={`h-${v?.handedness}`} id="handedness" name="handedness" defaultValue={v?.handedness || "right"} className="input">
              <option value="right">오른손잡이</option>
              <option value="left">왼손잡이</option>
            </select>
          </div>
        </div>
        {state.error && <p className="alert-error">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn w-full">
          {pending ? "가입 중..." : "가입하기"}
        </button>
        <p className="text-center text-sm text-muted">
          이미 회원이신가요?{" "}
          <Link href="/login" className="font-semibold text-gold hover:text-gold-strong">
            로그인
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
