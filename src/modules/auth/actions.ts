"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  type AuthActionState,
  loginSchema,
  readFormString,
  signupSchema,
} from "@/modules/auth/validation";

export async function loginAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = loginSchema.safeParse({
    email: readFormString(formData, "email"),
    password: readFormString(formData, "password"),
  });

  if (!result.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return {
      status: "error",
      message: "Email or password was not accepted.",
    };
  }

  redirect("/app");
}

export async function signupAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = signupSchema.safeParse({
    displayName: readFormString(formData, "display_name"),
    email: readFormString(formData, "email"),
    password: readFormString(formData, "password"),
    tenantName: readFormString(formData, "tenant_name"),
  });

  if (!result.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        display_name: result.data.displayName,
        tenant_name: result.data.tenantName,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message: "The account could not be created. Try signing in instead.",
    };
  }

  if (!data.session) {
    return {
      status: "success",
      message: "Check your email to confirm your account, then sign in.",
    };
  }

  const { error: bootstrapError } = await supabase.rpc("bootstrap_tenant", {
    requested_name: result.data.tenantName,
  });

  if (bootstrapError) {
    return {
      status: "error",
      message:
        "Your account was created, but its workspace could not be prepared.",
    };
  }

  redirect("/app");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
