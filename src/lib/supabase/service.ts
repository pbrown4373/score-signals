import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getServerEnvironment } from "@/lib/env/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export function createServiceClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnvironment();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Server media operations require SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createSupabaseClient<Database>(
    getSupabasePublicConfig().url,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
