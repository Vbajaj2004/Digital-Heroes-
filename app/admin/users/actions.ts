"use server";

import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  full_name: string | null;
  role: string | null;
  plan: string | null;
  subscription_status: string | null;
  renewal_date: string | null;
  draws_entered: number;
};

async function verifyAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in.");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    profile?.role !== "admin"
  ) {
    throw new Error("Admin access required.");
  }

  return supabase;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = await verifyAdmin();

  const [
    profilesResult,
    subscriptionsResult,
    entriesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name", {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from("subscriptions")
      .select(
        "user_id, plan, status, renewal_date, created_at"
      )
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("draw_entries")
      .select("user_id"),
  ]);

  if (profilesResult.error) {
    console.error(
      "Admin users profile lookup error:",
      profilesResult.error
    );

    throw new Error(
      profilesResult.error.message ||
        "Unable to load users."
    );
  }

  if (subscriptionsResult.error) {
    console.error(
      "Admin users subscription lookup error:",
      subscriptionsResult.error
    );

    throw new Error(
      subscriptionsResult.error.message ||
        "Unable to load subscriptions."
    );
  }

  if (entriesResult.error) {
    console.error(
      "Admin users draw entry lookup error:",
      entriesResult.error
    );

    throw new Error(
      entriesResult.error.message ||
        "Unable to load draw participation."
    );
  }

  const latestSubscription =
    new Map<
      string,
      {
        plan: string | null;
        status: string | null;
        renewal_date: string | null;
      }
    >();

  for (
    const subscription of
      subscriptionsResult.data ?? []
  ) {
    if (
      !latestSubscription.has(
        subscription.user_id
      )
    ) {
      latestSubscription.set(
        subscription.user_id,
        {
          plan: subscription.plan,
          status: subscription.status,
          renewal_date:
            subscription.renewal_date,
        }
      );
    }
  }

  const drawCounts =
    new Map<string, number>();

  for (
    const entry of entriesResult.data ?? []
  ) {
    drawCounts.set(
      entry.user_id,
      (drawCounts.get(entry.user_id) ?? 0) + 1
    );
  }

  return (profilesResult.data ?? []).map(
    (profile) => {
      const subscription =
        latestSubscription.get(profile.id);

      const cleanName =
        typeof profile.full_name === "string"
          ? profile.full_name.trim()
          : "";

      return {
        id: profile.id,

        full_name:
          cleanName.length > 0
            ? cleanName
            : null,

        role: profile.role,

        plan:
          subscription?.plan ?? null,

        subscription_status:
          subscription?.status ?? null,

        renewal_date:
          subscription?.renewal_date ?? null,

        draws_entered:
          drawCounts.get(profile.id) ?? 0,
      };
    }
  );
}