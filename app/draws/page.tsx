import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import EnterDrawButton from "./enter-draw-button";

async function DrawsContent() {
  const supabase = await createClient();

  // Check authentication
  const { data, error: authError } = await supabase.auth.getClaims();

  if (authError || !data?.claims) {
    redirect("/auth/login");
  }

  const userId = data.claims.sub as string;

  // Get published draws
  const { data: draws, error: drawsError } = await supabase
    .from("draws")
    .select("id, draw_date, status, winning_numbers, prize_pool")
    .eq("status", "published")
    .order("draw_date", { ascending: false });

  if (drawsError) {
    console.error("Draws fetch error:", drawsError);
  }

  // Count user's participation
  const {
    count: participationCount,
    error: participationError,
  } = await supabase
    .from("draw_entries")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId);

  if (participationError) {
    console.error(
      "Participation fetch error:",
      participationError
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            DIGITAL
            <span className="text-emerald-400">.</span>
            HEROES
          </Link>

          <Link
            href="/protected"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Page heading */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            The draw
          </p>

          <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">
            Your monthly chances to win.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
            Participate in Digital Heroes draws while supporting
            causes that matter to you.
          </p>
        </div>

        {/* Participation summary */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <p className="text-sm uppercase tracking-[0.15em] text-white/45">
            Your participation
          </p>

          <p className="mt-3 text-5xl font-bold">
            {participationCount ?? 0}
          </p>

          <p className="mt-2 text-white/50">
            Draws entered
          </p>
        </div>

        {/* Draw cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {draws && draws.length > 0 ? (
            draws.map((draw) => (
              <div
                key={draw.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-7"
              >
                {/* Status */}
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-400">
                    Published
                  </p>

                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
                    Draw #{draw.id}
                  </span>
                </div>

                {/* Draw date */}
                <h2 className="mt-5 text-3xl font-bold">
                  {new Date(draw.draw_date).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </h2>

                <p className="mt-3 text-white/55">
                  Monthly Digital Heroes draw
                </p>

                {/* Prize pool */}
                <div className="mt-6 rounded-2xl bg-white/5 p-5">
                  <p className="text-sm text-white/45">
                    Prize pool
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    ₹
                    {Number(
                      draw.prize_pool ?? 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Winning numbers */}
                {draw.winning_numbers &&
                draw.winning_numbers.length > 0 ? (
                  <div className="mt-6">
                    <p className="text-sm text-white/45">
                      Winning numbers
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {draw.winning_numbers.map(
                        (number: number, index: number) => (
                          <span
                            key={index}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 font-bold text-[#07111f]"
                          >
                            {number}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-white/5 p-5">
                    <p className="text-sm text-white/45">
                      Result
                    </p>

                    <p className="mt-2 font-semibold text-white/75">
                      Winning numbers have not been published yet.
                    </p>
                  </div>
                )}

                {/* Enter draw */}
                <EnterDrawButton drawId={draw.id} />
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <p className="text-lg font-semibold">
                No published draws yet.
              </p>

              <p className="mt-2 text-white/50">
                Check back when the next Digital Heroes draw is
                published.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function DrawsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />

            <p className="mt-4 text-white/60">
              Loading draws...
            </p>
          </div>
        </main>
      }
    >
      <DrawsContent />
    </Suspense>
  );
}