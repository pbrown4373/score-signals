"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthActionState } from "@/modules/auth/validation";
import { initialAuthActionState } from "@/modules/auth/validation";

type AuthFormProps = {
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  mode: "login" | "signup";
};

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialAuthActionState,
  );
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="space-y-5">
      {isSignup ? (
        <>
          <Field
            autoComplete="name"
            errors={state.fieldErrors?.displayName}
            label="Your name"
            name="display_name"
            type="text"
          />
          <Field
            autoComplete="organization"
            errors={state.fieldErrors?.tenantName}
            label="Workspace name"
            name="tenant_name"
            type="text"
          />
        </>
      ) : null}

      <Field
        autoComplete="email"
        errors={state.fieldErrors?.email}
        label="Email"
        name="email"
        type="email"
      />
      <Field
        autoComplete={isSignup ? "new-password" : "current-password"}
        errors={state.fieldErrors?.password}
        label="Password"
        name="password"
        type="password"
      />

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error" ? "text-sm text-red-700" : "text-sm"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="min-h-11 w-full rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-strong)] disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Working…" : isSignup ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-sm text-[var(--muted)]">
        {isSignup ? "Already have an account?" : "New to SCORE Signals?"}{" "}
        <Link
          className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
          href={isSignup ? "/login" : "/signup"}
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

type FieldProps = {
  autoComplete: string;
  errors?: string[];
  label: string;
  name: string;
  type: "email" | "password" | "text";
};

function Field({ autoComplete, errors, label, name, type }: FieldProps) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={errors?.length ? errorId : undefined}
        aria-invalid={Boolean(errors?.length)}
        autoComplete={autoComplete}
        className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 shadow-sm"
        id={name}
        name={name}
        required
        type={type}
      />
      {errors?.length ? (
        <p className="mt-2 text-sm text-red-700" id={errorId}>
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}
