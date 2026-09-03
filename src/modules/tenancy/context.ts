import { redirect } from "next/navigation";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type MembershipRole = Database["public"]["Enums"]["membership_role"];

export type TenantContext = {
  tenant: {
    id: string;
    name: string;
    slug: string | null;
  };
  user: {
    id: string;
    email: string | null;
  };
  role: MembershipRole;
};

export async function requireTenantContext(): Promise<TenantContext> {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  return context;
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return null;
  }

  let membership = await findFirstMembership(supabase, userId);

  if (!membership) {
    const claims = claimsData.claims as {
      email?: string;
      user_metadata?: { tenant_name?: string };
    };
    const fallbackName =
      claims.user_metadata?.tenant_name ??
      (claims.email
        ? `${claims.email.split("@")[0]} Workspace`
        : "My Workspace");
    const { error } = await supabase.rpc("bootstrap_tenant", {
      requested_name: fallbackName,
    });

    if (error) {
      throw new Error("Unable to prepare the authenticated workspace.");
    }

    membership = await findFirstMembership(supabase, userId);
  }

  if (!membership) {
    throw new Error("Authenticated user has no tenant membership.");
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("id", membership.tenant_id)
    .single();

  if (tenantError || !tenant) {
    throw new Error("Unable to load the authenticated tenant.");
  }

  const claims = claimsData.claims as { email?: string };
  return {
    tenant,
    user: {
      id: userId,
      email: claims.email ?? null,
    },
    role: membership.role,
  };
}

async function findFirstMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load tenant membership.");
  }

  return data;
}
