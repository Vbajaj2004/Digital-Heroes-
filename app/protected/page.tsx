import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import ScoreSection from "./score-section";
import WinnerProof from "./winner-proof";

type Subscription = {
  plan: string | null;
  status: string | null;
  renewal_date: string | null;
  created_at: string | null;
};

type WinnerRecord = {
  id: number;
  draw_id: number;
  match_type: string | number | null;
  prize_amount: number | null;
  proof_url: string | null;
  payment_status: string | null;
  verification_status: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) {
    return null;
  }

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFallbackRenewalDate(
  subscription: Subscription | null
) {
  if (!subscription?.created_at || !subscription.plan) {
    return null;
  }

  const date = new Date(subscription.created_at);

  if (subscription.plan === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString();
}

function getPaymentStatus(winners: WinnerRecord[]) {
  if (
    winners.some(
      (winner) => winner.payment_status === "paid"
    )
  ) {
    return "Paid";
  }

  if (
    winners.some(
      (winner) =>
        winner.verification_status === "approved" &&
        winner.payment_status === "pending"
    )
  ) {
    return "Payment pending";
  }

  if (
    winners.some(
      (winner) =>
        winner.verification_status === "pending"
    )
  ) {
    return "Verification pending";
  }

  if (
    winners.some(
      (winner) =>
        winner.verification_status === "rejected"
    )
  ) {
    return "Rejected";
  }

  return "No winnings yet";
}

async function ProtectedContent() {
  const supabase = await createClient();

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const userId = user.id;

  // =========================================================
  // PROFILE
  // =========================================================

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();

  // =========================================================
  // ADMIN REDIRECT
  // =========================================================

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  // =========================================================
  // SUBSCRIPTION
  // =========================================================

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, renewal_date, created_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  // =========================================================
  // LATEST 5 GOLF SCORES
  // =========================================================

  const { data: scores } = await supabase
    .from("golf_scores")
    .select("id, score, score_date")
    .eq("user_id", userId)
    .order("score_date", {
      ascending: false,
    })
    .limit(5);

  // =========================================================
  // CHARITY SELECTION
  // =========================================================

  const { data: charitySelection } =
    await supabase
      .from("user_charities")
      .select(
        "charity_id, contribution_percentage"
      )
      .eq("user_id", userId)
      .maybeSingle();

  // =========================================================
  // CHARITY DETAILS
  // =========================================================

  let selectedCharity: {
    name: string;
    description: string | null;
  } | null = null;

  if (charitySelection?.charity_id) {
    const { data: charity } =
      await supabase
        .from("charities")
        .select("name, description")
        .eq(
          "id",
          charitySelection.charity_id
        )
        .maybeSingle();

    if (charity) {
      selectedCharity = charity;
    }
  }

  // =========================================================
  // DRAW PARTICIPATION
  // =========================================================

  const {
    count: drawsEnteredCount,
  } = await supabase
    .from("draw_entries")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId);

  // =========================================================
  // UPCOMING DRAW
  // =========================================================

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const { data: upcomingDraw } =
    await supabase
      .from("draws")
      .select("draw_date, prize_pool")
      .eq("status", "published")
      .gte("draw_date", today)
      .order("draw_date", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

  let nextDrawDate =
    upcomingDraw?.draw_date ?? null;

  if (!nextDrawDate) {
    const {
      data: latestPublishedDraw,
    } = await supabase
      .from("draws")
      .select("draw_date")
      .eq("status", "published")
      .order("draw_date", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (latestPublishedDraw?.draw_date) {
      const calculatedDate = new Date(
        latestPublishedDraw.draw_date
      );

      calculatedDate.setMonth(
        calculatedDate.getMonth() + 1
      );

      nextDrawDate = calculatedDate
        .toISOString()
        .slice(0, 10);
    }
  }

  // =========================================================
  // WINNINGS
  // =========================================================

  const { data: winnerRecords } =
    await supabase
      .from("winners")
      .select(
        "id, draw_id, match_type, prize_amount, proof_url, payment_status, verification_status"
      )
      .eq("user_id", userId)
      .order("id", {
        ascending: false,
      });

  const winners: WinnerRecord[] =
    winnerRecords || [];

  const totalWinnings = winners
    .filter(
      (winner) =>
        winner.verification_status ===
        "approved"
    )
    .reduce(
      (total, winner) =>
        total +
        Number(winner.prize_amount || 0),
      0
    );

  const paymentStatus =
    getPaymentStatus(winners);

  // =========================================================
  // RENEWAL DATE
  // =========================================================

  const renewalDate =
    subscription?.renewal_date ??
    getFallbackRenewalDate(
      subscription as Subscription | null
    );

  // =========================================================
  // DISPLAY NAME
  // =========================================================

  const displayName =
    profile?.full_name || "Hero";

  // =========================================================
  // SUBSCRIBER DASHBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-[#07111f] text-white">

      {/* HEADER */}

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-8">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
                Subscriber dashboard
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                Welcome back, {displayName}
              </h1>

              <p className="mt-2 text-white/55">
                Track your scores, charity impact
                and draw participation.
              </p>

            </div>

            <Link
              href="/"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
            >
              Back to home
            </Link>

          </div>

        </div>
      </section>

      {/* DASHBOARD CONTENT */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* TOP CARDS */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* SUBSCRIPTION */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm text-white/45">
              SUBSCRIPTION
            </p>

            <div className="mt-5 flex items-center justify-between">

              <h2 className="text-2xl font-semibold">
                {subscription?.plan
                  ? subscription.plan
                      .charAt(0)
                      .toUpperCase() +
                    subscription.plan.slice(1)
                  : "Not active"}
              </h2>

              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {subscription?.status ||
                  "inactive"}
              </span>

            </div>

            <p className="mt-4 text-sm text-white/55">
              {formatDate(renewalDate)
                ? `Renewal: ${formatDate(
                    renewalDate
                  )}`
                : "Renewal date unavailable"}
            </p>

            <Link
              href="/subscribe"
              className="mt-6 block w-full rounded-full bg-emerald-400 px-5 py-3 text-center font-semibold text-[#07111f] transition hover:bg-emerald-300"
            >
              Manage subscription
            </Link>

          </div>

          {/* DRAW PARTICIPATION */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm text-white/45">
              DRAW PARTICIPATION
            </p>

            <h2 className="mt-5 text-4xl font-bold">
              {drawsEnteredCount ?? 0}
            </h2>

            <p className="mt-2 text-white/55">
              Draws entered
            </p>

            <div className="mt-8 rounded-2xl bg-white/5 p-4">

              <p className="text-sm text-white/50">
                Upcoming draw
              </p>

              <p className="mt-2 font-semibold">
                {nextDrawDate
                  ? formatDate(nextDrawDate)
                  : "Next monthly draw"}
              </p>

            </div>

            <Link
              href="/draws"
              className="mt-4 inline-block text-sm font-semibold text-emerald-300 hover:text-emerald-200"
            >
              View draws →
            </Link>

          </div>

          {/* WINNINGS */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm text-white/45">
              WINNINGS
            </p>

            <h2 className="mt-5 text-4xl font-bold">
              ₹
              {totalWinnings.toLocaleString(
                "en-IN"
              )}
            </h2>

            <p className="mt-2 text-white/55">
              Total winnings
            </p>

            <div className="mt-8 rounded-2xl bg-white/5 p-4">

              <p className="text-sm text-white/50">
                Payment status
              </p>

              <p className="mt-2 font-semibold">
                {paymentStatus}
              </p>

            </div>

          </div>

        </div>

        {/* GOLF SCORES */}

        <ScoreSection
          userId={userId}
          scores={scores}
        />

        {/* WINNER PROOF */}

        <WinnerProof winners={winnerRecords || []} />

        {/* CHARITY + QUICK ACTIONS */}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">

          {/* CHARITY */}

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6">

            <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
              Your charity
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              {selectedCharity?.name ||
                "Choose your charity"}
            </h2>

            <p className="mt-3 leading-7 text-white/55">
              {selectedCharity?.description ||
                "Choose a cause that matters to you and direct part of your subscription toward it."}
            </p>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/5 px-5 py-4">

              <span className="text-sm text-white/50">
                Contribution
              </span>

              <span className="text-xl font-bold text-emerald-300">
                {charitySelection?.contribution_percentage ??
                  10}
                %
              </span>

            </div>

            <Link
              href="/charities"
              className="mt-6 inline-block rounded-full border border-white/15 px-5 py-3 font-semibold transition hover:bg-white/10"
            >
              Manage charity
            </Link>

          </div>

          {/* QUICK ACTIONS */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm uppercase tracking-[0.2em] text-white/45">
              Quick actions
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <a
                href="#scores"
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
              >
                <p className="font-semibold">
                  Add golf score
                </p>

                <p className="mt-2 text-sm text-white/45">
                  Record your latest Stableford score.
                </p>
              </a>

              <Link
                href="/charities"
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
              >
                <p className="font-semibold">
                  Explore charities
                </p>

                <p className="mt-2 text-sm text-white/45">
                  Find a cause you want to support.
                </p>
              </Link>

              <Link
                href="/draws"
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
              >
                <p className="font-semibold">
                  View draws
                </p>

                <p className="mt-2 text-sm text-white/45">
                  See participation and draw results.
                </p>
              </Link>

              <Link
                href="/protected/profile"
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
              >
                <p className="font-semibold">
                  Profile settings
                </p>

                <p className="mt-2 text-sm text-white/45">
                  Manage your account details.
                </p>
              </Link>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

// PAGE WRAPPER

export default function ProtectedPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">

          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />

            <p className="mt-4 text-white/60">
              Loading your dashboard...
            </p>

          </div>

        </main>
      }
    >
      <ProtectedContent />
    </Suspense>
  );
}