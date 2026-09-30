import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import UserManagement from "./user-management";

async function AdminContent() {
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

  // =========================================================
  // CHECK ADMIN ROLE
  // =========================================================

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    redirect("/protected");
  }

  // =========================================================
  // USERS
  // =========================================================

  const {
    data: allUsers,
    error: usersError,
  } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, created_at"
    )
    .order("created_at", {
      ascending: false,
    });

  // =========================================================
  // SUBSCRIPTIONS
  // =========================================================

  const {
    data: allSubscriptions,
    error: subscriptionsError,
  } = await supabase
    .from("subscriptions")
    .select(
      "user_id, plan, status, renewal_date"
    );

  // =========================================================
  // TOTAL USERS
  // =========================================================

  const { count: totalUsers } =
    await supabase
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      });

  // =========================================================
  // ACTIVE SUBSCRIPTIONS
  // =========================================================

  const {
    count: activeSubscriptions,
  } = await supabase
    .from("subscriptions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("status", "active");

  // =========================================================
  // TOTAL DRAWS
  // =========================================================

  const { count: totalDraws } =
    await supabase
      .from("draws")
      .select("*", {
        count: "exact",
        head: true,
      });

  // =========================================================
  // PUBLISHED DRAWS
  // =========================================================

  const {
    count: publishedDraws,
  } = await supabase
    .from("draws")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("status", "published");

  // =========================================================
  // TOTAL CHARITIES
  // =========================================================

  const {
    count: totalCharities,
  } = await supabase
    .from("charities")
    .select("*", {
      count: "exact",
      head: true,
    });

  // =========================================================
  // RECENT DRAWS
  // =========================================================

  const {
    data: recentDraws,
  } = await supabase
    .from("draws")
    .select(
      "id, draw_date, draw_type, status, winning_numbers, prize_pool"
    )
    .order("draw_date", {
      ascending: false,
    })
    .limit(6);

  // =========================================================
  // DEBUG
  // =========================================================

  if (usersError) {
    console.error(
      "Users query error:",
      usersError
    );
  }

  if (subscriptionsError) {
    console.error(
      "Subscriptions query error:",
      subscriptionsError
    );
  }

  // =========================================================
  // DISPLAY NAME
  // =========================================================

  const displayName =
    profile.full_name || "Administrator";

  // =========================================================
  // ADMIN DASHBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-[#07111f] text-white">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="border-b border-white/10">

        <div className="mx-auto max-w-7xl px-6 py-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
                Administrator panel
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                Welcome, {displayName}
              </h1>

              <p className="mt-2 max-w-3xl text-white/55">
                Manage Digital Heroes users,
                subscriptions, draws, charities
                and winner operations from one place.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href="/"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
              >
                View website
              </Link>

              <Link
                href="/protected"
                className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-[#07111f] transition hover:bg-emerald-300"
              >
                Subscriber view
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* ===================================================
            STAT CARDS
        ==================================================== */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {/* USERS */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm uppercase tracking-wider text-white/40">
              Total users
            </p>

            <p className="mt-4 text-4xl font-bold">
              {totalUsers ?? 0}
            </p>

            <p className="mt-2 text-sm text-white/45">
              Registered platform users
            </p>

          </div>

          {/* SUBSCRIPTIONS */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm uppercase tracking-wider text-white/40">
              Active subscriptions
            </p>

            <p className="mt-4 text-4xl font-bold">
              {activeSubscriptions ?? 0}
            </p>

            <p className="mt-2 text-sm text-white/45">
              Currently active members
            </p>

          </div>

          {/* DRAWS */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm uppercase tracking-wider text-white/40">
              Draws
            </p>

            <p className="mt-4 text-4xl font-bold">
              {totalDraws ?? 0}
            </p>

            <p className="mt-2 text-sm text-white/45">
              {publishedDraws ?? 0} published
            </p>

          </div>

          {/* CHARITIES */}

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6">

            <p className="text-sm uppercase tracking-wider text-emerald-300/70">
              Charities
            </p>

            <p className="mt-4 text-4xl font-bold">
              {totalCharities ?? 0}
            </p>

            <p className="mt-2 text-sm text-white/45">
              Available causes
            </p>

          </div>

        </div>

        {/* ===================================================
            CONTROL CENTER
        ==================================================== */}

        <div className="mt-10">

          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
            Control center
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Platform management
          </h2>

          <p className="mt-2 text-white/50">
            Access the main administrator operations.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-5">

            {/* USERS */}

            <a
              href="#users"
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl">
                👤
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                Users
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/45">
                View and edit user profiles and
                subscription information.
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-emerald-300">
                Manage users →
              </span>

            </a>

            {/* DRAWS */}

            <a
              href="#draws"
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl">
                🎯
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                Draws
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Configure draws, simulate results
                and publish winning numbers.
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-emerald-300">
                Manage draws →
              </span>

            </a>

            {/* CHARITIES */}

            <Link
              href="/charities"
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl">
                ❤️
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                Charities
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Add and manage the causes displayed
                to subscribers.
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-emerald-300">
                View charities →
              </span>

            </Link>

            {/* WINNERS */}

            <a
              href="#winners"
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl">
                🏆
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                Winners
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Review winner proof, verification
                status and payouts.
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-emerald-300">
                Manage winners →
              </span>

            </a>

            {/* REPORTS */}

            <a
              href="#reports"
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl">
                📊
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                Reports
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/45">
                View platform and draw statistics.
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-emerald-300">
                View reports →
              </span>

            </a>

          </div>

        </div>

        {/* ===================================================
            USER MANAGEMENT
        ==================================================== */}

        <UserManagement
          users={allUsers ?? []}
          subscriptions={
            allSubscriptions ?? []
          }
        />

        {/* ===================================================
            DRAW MANAGEMENT
        ==================================================== */}

        <section
          id="draws"
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >

          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
            Draw management
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Recent draws
          </h2>

          <p className="mt-2 text-sm text-white/45">
            Existing draw records from the platform.
          </p>

          <div className="mt-6 overflow-x-auto">

            <table className="w-full min-w-[750px] text-left">

              <thead>

                <tr className="border-b border-white/10 text-sm text-white/40">

                  <th className="pb-4 pr-5">
                    Date
                  </th>

                  <th className="pb-4 pr-5">
                    Type
                  </th>

                  <th className="pb-4 pr-5">
                    Status
                  </th>

                  <th className="pb-4 pr-5">
                    Winning numbers
                  </th>

                  <th className="pb-4">
                    Prize pool
                  </th>

                </tr>

              </thead>

              <tbody>

                {recentDraws &&
                recentDraws.length > 0 ? (
                  recentDraws.map(
                    (draw) => (
                      <tr
                        key={draw.id}
                        className="border-b border-white/5"
                      >

                        <td className="py-4 pr-5 font-medium">
                          {draw.draw_date
                            ? new Date(
                                draw.draw_date
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "—"}
                        </td>

                        <td className="py-4 pr-5 text-white/60">
                          {draw.draw_type ||
                            "Standard"}
                        </td>

                        <td className="py-4 pr-5">

                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold">
                            {draw.status}
                          </span>

                        </td>

                        <td className="py-4 pr-5 text-white/50">
                          {draw.winning_numbers
                            ? JSON.stringify(
                                draw.winning_numbers
                              )
                            : "Not published"}
                        </td>

                        <td className="py-4 font-semibold">
                          ₹
                          {Number(
                            draw.prize_pool ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                      </tr>
                    )
                  )
                ) : (
                  <tr>

                    <td
                      colSpan={5}
                      className="py-10 text-center text-white/40"
                    >
                      No draws found.
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ===================================================
            WINNERS
        ==================================================== */}

        <section
          id="winners"
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >

          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
            Winners management
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Winner verification
          </h2>

          <p className="mt-3 max-w-3xl text-white/50">
            Winner proof submission, verification
            and payout tracking will be connected here.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6">

            <p className="font-semibold">
              No pending winners
            </p>

            <p className="mt-2 text-sm text-white/40">
              Winners will appear here after the
              draw engine produces qualifying results.
            </p>

          </div>

        </section>

        {/* ===================================================
            REPORTS
        ==================================================== */}

        <section
          id="reports"
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >

          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
            Reports & analytics
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Platform overview
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl bg-white/5 p-5">

              <p className="text-sm text-white/40">
                Total users
              </p>

              <p className="mt-2 text-2xl font-bold">
                {totalUsers ?? 0}
              </p>

            </div>

            <div className="rounded-2xl bg-white/5 p-5">

              <p className="text-sm text-white/40">
                Active subscriptions
              </p>

              <p className="mt-2 text-2xl font-bold">
                {activeSubscriptions ?? 0}
              </p>

            </div>

            <div className="rounded-2xl bg-white/5 p-5">

              <p className="text-sm text-white/40">
                Total charities
              </p>

              <p className="mt-2 text-2xl font-bold">
                {totalCharities ?? 0}
              </p>

            </div>

          </div>

        </section>

      </section>

    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">

          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />

            <p className="mt-4 text-white/60">
              Loading administrator dashboard...
            </p>

          </div>

        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}