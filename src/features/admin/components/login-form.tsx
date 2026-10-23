"use client";

import { useActionState } from "react";
import { signIn } from "../api/auth-actions";
import { initialSignInState } from "../api/auth-state";

const ERRORS = {
  invalid: "Invalid email or password.",
  not_admin: "This account is not an admin.",
  generic: "Sign-in failed. Try again later.",
} as const;

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialSignInState);

  return (
    <form action={action} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-ring"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-ring"
        />
      </label>
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {ERRORS[state.error]}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
