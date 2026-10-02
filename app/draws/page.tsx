import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import EnterDrawButton from "./enter-draw-button";

type Draw = {
  id: number;
  draw_date: string;
  status: string;
  winning_numbers: number[] | null;
  prize_pool: number | null;
};

function getIndiaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDrawDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00Z`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

async function DrawsContent() {
  const supabase = await createClient();

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const { data, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !data?.claims) {
    redirect("/auth/login");
  }

  const userId = data.claims.sub as string;

  // =========================================================
  // GET ALL PUBLISHED DRAWS
  // =========================================================

  const {
    data: draws,
    error: drawsError,
  } = await supabase
    .from("draws")
    .select(
      "id, draw_date, status, winning_numbers, prize_pool"
    )
    .eq("status", "published")
    .order("draw_date", {
      ascending: false,
    });

  if (drawsError) {
    console.error("Draws fetch error:", drawsError);
  }

  const publishedDraws: Draw[] = draws || [];

  // =========================================================
  // PARTICIPATION COUNT
  // =========================================================

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

  // =========================================================
  // INDIA TODAY
  // =========================================================

  const today = getIndiaToday();

  return (
    <main className="min-h-screen bg-[#07111f] text-white">

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            DIGITAL
            <span className="text-emerald-400">
              .
            </span>
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

      {/* =====================================================
          PAGE CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-16">

        {/* Heading */}

        <div className="max-w-3xl">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            The draw
          </p>

          <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">
            Your monthly chances to win.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
            Participate in Digital Heroes draws while
            supporting causes that matter to you.
          </p>

        </div>

        {/* ===================================================
            PARTICIPATION SUMMARY
        ==================================================== */}

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

        {/* ===================================================
            DRAW CARDS
        ==================================================== */}

        <div className="mt-8 grid gap-6 md:grid-cols-2">

          {publishedDraws.length > 0 ? (

            publishedDraws.map((draw) => {

              /*
               * A future draw is upcoming.
               * A draw dated today is considered completed
               * once it has already been published.
               */
              const isUpcoming =
                draw.draw_date > today;

              const hasWinningNumbers =
                Array.isArray(draw.winning_numbers) &&
                draw.winning_numbers.length > 0;

              return (

                <div
                  key={draw.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-7"
                >

                  {/* -----------------------------------------
                      STATUS
                  ------------------------------------------ */}

                  <div className="flex items-center justify-between gap-4">

                    <p
                      className={`text-sm font-semibold uppercase tracking-[0.15em] ${
                        isUpcoming
                          ? "text-emerald-400"
                          : "text-white/40"
                      }`}
                    >
                      {isUpcoming
                        ? "Upcoming"
                        : "Completed"}
                    </p>

                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
                      Draw #{draw.id}
                    </span>

                  </div>

                  {/* -----------------------------------------
                      DATE
                  ------------------------------------------ */}

                  <h2 className="mt-5 text-3xl font-bold">
                    {formatDrawDate(draw.draw_date)}
                  </h2>

                  <p className="mt-3 text-white/55">
                    Monthly Digital Heroes draw
                  </p>

                  {/* -----------------------------------------
                      PRIZE POOL
                  ------------------------------------------ */}

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

                  {/* -----------------------------------------
                      WINNING NUMBERS
                  ------------------------------------------ */}

                  {hasWinningNumbers ? (

                    <div className="mt-6">

                      <p className="text-sm text-white/45">
                        Winning numbers
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">

                        {draw.winning_numbers!.map(
                          (
                            number: number,
                            index: number
                          ) => (

                            <span
                              key={`${draw.id}-${number}-${index}`}
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
                        {isUpcoming
                          ? "Winning numbers will be published after the draw."
                          : "Winning numbers have not been published yet."}
                      </p>

                    </div>

                  )}

                  {/* -----------------------------------------
                      DRAW ACTION
                  ------------------------------------------ */}

                  {isUpcoming ? (

                    <EnterDrawButton
                      drawId={draw.id}
                    />

                  ) : (

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">

                      <p className="text-sm font-semibold text-white/70">
                        Draw closed
                      </p>

                      <p className="mt-1 text-sm text-white/40">
                        Entries are no longer accepted for
                        this draw.
                      </p>

                    </div>

                  )}

                </div>

              );

            })

          ) : (

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">

              <p className="text-lg font-semibold">
                No published draws yet.
              </p>

              <p className="mt-2 text-white/50">
                Check back when the next Digital Heroes
                draw is published.
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