import { z } from "zod";

const email = z.email("Enter a valid email address.");
const password = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(128, "Password must contain at most 128 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const loginSchema = z.object({
  email,
  password,
});

export const signupSchema = loginSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(100, "Name must contain at most 100 characters."),
  tenantName: z
    .string()
    .trim()
    .min(2, "Workspace name must contain at least 2 characters.")
    .max(80, "Workspace name must contain at most 80 characters."),
});

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialAuthActionState: AuthActionState = {
  status: "idle",
};

export function readFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
