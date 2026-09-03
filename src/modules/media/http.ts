import { createClient } from "@/lib/supabase/server";
import { MediaError } from "@/modules/media/errors";
import { MediaRepository } from "@/modules/media/repository";
import { getTenantContext } from "@/modules/tenancy/context";

export async function requireMediaRequest(write = false) {
  const context = await getTenantContext();
  if (!context) {
    throw new MediaError("AUTH_REQUIRED", "Authentication is required.", 401);
  }
  if (write && context.role === "VIEWER") {
    throw new MediaError(
      "CREATIVE_FORBIDDEN",
      "Viewer access is read-only.",
      403,
    );
  }
  const supabase = await createClient();
  return {
    context,
    repository: new MediaRepository(supabase, context.tenant.id),
  };
}
