"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionResult } from "./actions";

const initialState: LoginActionResult = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm text-neutral-400">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="rounded-full border border-neutral-700 bg-transparent px-4 py-3 text-white outline-none focus:border-white"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm text-neutral-400">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-full border border-neutral-700 bg-transparent px-4 py-3 text-white outline-none focus:border-white"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-neutral-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-white px-8 py-3 text-base font-semibold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
