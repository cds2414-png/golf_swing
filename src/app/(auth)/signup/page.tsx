"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { signup, type AuthState } from "../actions";

const thisYear = new Date().getFullYear();

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, {});
  const [showPassword, setShowPassword] = useState(false);
  const v = state.values;

  return (
    <AuthShell eyebrow="Join SwingCheck" title="30초 회원가입" subtitle="메일 인증 없이 바로 시작해요">
      <form action={action} className="card space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              이름
            </label>
            <input id="name" name="name" required autoComplete="name" defaultValue={v?.name} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="birthYear">
              출생 연도
            </label>
            <input
              id="birthYear"
              name="birthYear"
              type="number"
              inputMode="numeric"
              min={1920}
              max={thisYear - 5}
              placeholder="예: 1985"
              required
              defaultValue={v?.birthYear}
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={v?.email}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            비밀번호 <span className="font-normal text-muted">(8자 이상)</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              minLength={8}
              autoComplete="new-password"
              required
              className="input pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              {showPassword ? "숨기기" : "보기"}
            </button>
          </div>
        </div>
        <fieldset key={`h-${v?.handedness}`}>
          <legend className="label">타석</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "right", label: "오른손잡이" },
              { value: "left", label: "왼손잡이" },
            ].map((o) => (
              <label
                key={o.value}
                className="cursor-pointer rounded-xl border border-border-strong bg-black/20 px-4 py-3 text-center text-sm transition has-checked:border-gold/70 has-checked:bg-gold-soft has-checked:text-gold-strong"
              >
                <input
                  type="radio"
                  name="handedness"
                  value={o.value}
                  defaultChecked={(v?.handedness || "right") === o.value}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-xs text-muted">출생 연도와 타석은 나이·스윙 방향에 맞춘 분석에만 사용돼요.</p>
        {state.error && <p className="alert-error">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn w-full py-4 text-base">
          {pending ? "가입 중..." : "가입하고 바로 시작하기"}
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
