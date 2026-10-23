"use client";

import { useActionState } from "react";
import { login, type AuthState } from "../actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
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
          defaultValue={state.values?.email}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      {state.error && <p className="alert-error">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn w-full">
        {pending ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
