"use server";

import { createClient } from "@/lib/supabase/server";

export type AdminStats = {
  totalUsers: number;
  activeSubscribers: number;
  totalPrizePool: number;
  currentPrizePool: number;

  charityContributions: number;

  totalDraws: number;
  publishedDraws: number;
  totalDrawEntries: number;

  totalWinners: number;
  approvedWinnings: number;
  paidWinnings: number;

  activeCharities: number;
  featuredCharities: number;

  fiveMatchWinners: number;
  fourMatchWinners: number;
  threeMatchWinners: number;

  latestDraw: {
    id: number | string;
    draw_date: string | null;
    prize_pool: number;
    status: string | null;
  } | null;
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

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
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

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await verifyAdmin();

  const [
    profilesResult,
    subscriptionsResult,
    drawsResult,
    entriesResult,
    winnersResult,
    charitiesResult,
    userCharitiesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role"),

    supabase
      .from("subscriptions")
      .select(
        "user_id, plan, status, created_at"
      )
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("draws")
      .select(
        "id, draw_date, prize_pool, status"
      )
      .order("draw_date", {
        ascending: false,
      }),

    supabase
      .from("draw_entries")
      .select("id, user_id"),

    supabase
      .from("winners")
      .select(
        "id, user_id, match_type, prize_amount, verification_status, payment_status"
      ),

    supabase
      .from("charities")
      .select("id, active, featured"),

    supabase
      .from("user_charities")
      .select(
        "user_id, charity_id, contribution_percentage"
      ),
  ]);

  if (profilesResult.error) {
    throw new Error(
      profilesResult.error.message
    );
  }

  if (subscriptionsResult.error) {
    throw new Error(
      subscriptionsResult.error.message
    );
  }

  if (drawsResult.error) {
    throw new Error(
      drawsResult.error.message
    );
  }

  if (entriesResult.error) {
    throw new Error(
      entriesResult.error.message
    );
  }

  if (winnersResult.error) {
    throw new Error(
      winnersResult.error.message
    );
  }

  if (charitiesResult.error) {
    throw new Error(
      charitiesResult.error.message
    );
  }

  if (userCharitiesResult.error) {
    throw new Error(
      userCharitiesResult.error.message
    );
  }

  const profiles = profilesResult.data ?? [];
  const subscriptions =
    subscriptionsResult.data ?? [];
  const draws = drawsResult.data ?? [];
  const entries = entriesResult.data ?? [];
  const winners = winnersResult.data ?? [];
  const charities =
    charitiesResult.data ?? [];
  const userCharities =
    userCharitiesResult.data ?? [];

  // ---------------------------------------------------------
  // USERS
  // ---------------------------------------------------------

  const totalUsers = profiles.length;

  // ---------------------------------------------------------
  // LATEST SUBSCRIPTION PER USER
  // ---------------------------------------------------------

  const latestSubscription = new Map<
    string,
    {
      plan: string | null;
      status: string | null;
    }
  >();

  for (const subscription of subscriptions) {
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
        }
      );
    }
  }

  const activeSubscribers =
    Array.from(
      latestSubscription.values()
    ).filter(
      (subscription) =>
        subscription.status === "active"
    ).length;

  // ---------------------------------------------------------
  // DRAW STATISTICS
  // ---------------------------------------------------------

  const publishedDraws = draws.filter(
    (draw) =>
      draw.status === "published"
  );

  const totalDraws = draws.length;

  const totalPrizePool =
    publishedDraws.reduce(
      (total, draw) =>
        total +
        Number(draw.prize_pool || 0),
      0
    );

  const currentPrizePool =
    publishedDraws.length > 0
      ? Number(
          publishedDraws[0].prize_pool || 0
        )
      : 0;

  const totalDrawEntries =
    entries.length;

  const latestDraw =
    draws.length > 0
      ? {
          id: draws[0].id,
          draw_date: draws[0].draw_date,
          prize_pool: Number(
            draws[0].prize_pool || 0
          ),
          status: draws[0].status,
        }
      : null;

  // ---------------------------------------------------------
  // WINNERS
  // ---------------------------------------------------------

  const totalWinners = winners.length;

  const approvedWinnings =
    winners
      .filter(
        (winner) =>
          winner.verification_status ===
          "approved"
      )
      .reduce(
        (total, winner) =>
          total +
          Number(
            winner.prize_amount || 0
          ),
        0
      );

  const paidWinnings =
    winners
      .filter(
        (winner) =>
          winner.payment_status ===
          "paid"
      )
      .reduce(
        (total, winner) =>
          total +
          Number(
            winner.prize_amount || 0
          ),
        0
      );

  const fiveMatchWinners =
    winners.filter(
      (winner) =>
        String(winner.match_type) === "5"
    ).length;

  const fourMatchWinners =
    winners.filter(
      (winner) =>
        String(winner.match_type) === "4"
    ).length;

  const threeMatchWinners =
    winners.filter(
      (winner) =>
        String(winner.match_type) === "3"
    ).length;

  // ---------------------------------------------------------
  // CHARITIES
  // ---------------------------------------------------------

  const activeCharities =
    charities.filter(
      (charity) => charity.active
    ).length;

  const featuredCharities =
    charities.filter(
      (charity) => charity.featured
    ).length;

  // ---------------------------------------------------------
  // CHARITY CONTRIBUTIONS
  // ---------------------------------------------------------
  //
  // Current subscription prices used by the project:
  // Monthly = ₹499
  // Yearly  = ₹4,999
  //
  // The contribution amount is calculated using:
  // plan price × user's selected percentage.
  //
  // Only users with an active latest subscription
  // are included.
  // ---------------------------------------------------------

  const charitySelectionMap = new Map<
    string,
    number
  >();

  for (const selection of userCharities) {
    charitySelectionMap.set(
      selection.user_id,
      Number(
        selection.contribution_percentage ||
          0
      )
    );
  }

  let charityContributions = 0;

  for (const [
    userId,
    subscription,
  ] of latestSubscription.entries()) {
    if (
      subscription.status !== "active"
    ) {
      continue;
    }

    const percentage =
      charitySelectionMap.get(userId) ??
      0;

    const planPrice =
      subscription.plan === "yearly"
        ? 4999
        : 499;

    charityContributions +=
      planPrice *
      (percentage / 100);
  }

  return {
    totalUsers,
    activeSubscribers,

    totalPrizePool,
    currentPrizePool,

    charityContributions,

    totalDraws,
    publishedDraws:
      publishedDraws.length,
    totalDrawEntries,

    totalWinners,
    approvedWinnings,
    paidWinnings,

    activeCharities,
    featuredCharities,

    fiveMatchWinners,
    fourMatchWinners,
    threeMatchWinners,

    latestDraw,
  };
}