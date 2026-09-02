import { z } from "zod";

const supabasePublicConfigSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
});

export type SupabasePublicConfig = z.infer<typeof supabasePublicConfigSchema>;

export function parseSupabasePublicConfig(input: {
  url?: string;
  publishableKey?: string;
}): SupabasePublicConfig {
  const result = supabasePublicConfigSchema.safeParse(input);

  if (!result.success) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return result.data;
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  return parseSupabasePublicConfig({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
