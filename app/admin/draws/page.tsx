"use client";

import Link from "next/link";
import { useState } from "react";

type SimulationResult = {
  winningNumbers: number[];
  participantCount: number;

  winners: {
    fiveMatch: {
      user_id: string;
      matches: number;
    }[];

    fourMatch: {
      user_id: string;
      matches: number;
    }[];

    threeMatch: {
      user_id: string;
      matches: number;
    }[];
  };

  prizes: {
    fiveMatch: {
      pool: number;
      winnerCount: number;
      prizePerWinner: number;
      rollover: boolean;
    };

    fourMatch: {
      pool: number;
      winnerCount: number;
      prizePerWinner: number;
      rollover: boolean;
    };

    threeMatch: {
      pool: number;
      winnerCount: number;
      prizePerWinner: number;
      rollover: boolean;
    };
  };
};

export default function AdminDrawsPage() {
  const [simulation, setSimulation] =
    useState<SimulationResult | null>(null);

  const [simulating, setSimulating] =
    useState(false);

  const [publishing, setPublishing] =
    useState(false);

  const [prizePool, setPrizePool] =
    useState("48000");

  const [error, setError] = useState("");

  const [publishMessage, setPublishMessage] =
    useState("");

  async function readJsonResponse(
    response: Response
  ) {
    const text = await response.text();

    if (!text) {
      throw new Error(
        `Server returned an empty response (HTTP ${response.status}).`
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Server returned an invalid response (HTTP ${response.status}).`
      );
    }
  }

  async function runSimulation() {
    setSimulating(true);
    setError("");
    setPublishMessage("");
    setSimulation(null);

    try {
      const response = await fetch(
        "/api/admin/simulate-draw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prizePool: Number(prizePool),
          }),
        }
      );

      const data =
        await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || "Simulation failed."
        );
      }

      setSimulation(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to run simulation."
      );
    } finally {
      setSimulating(false);
    }
  }

  async function runTestWinner() {
    setSimulating(true);
    setError("");
    setPublishMessage("");
    setSimulation(null);

    try {
      const response = await fetch(
        "/api/admin/simulate-draw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prizePool: Number(prizePool),
            testWinner: true,
          }),
        }
      );

      const data =
        await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Test winner simulation failed."
        );
      }

      setSimulation(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create test winner simulation."
      );
    } finally {
      setSimulating(false);
    }
  }

  async function publishDraw() {
    if (!simulation) {
      return;
    }

    const confirmed =
      window.confirm(
        "Publish this draw? This will permanently create the draw and any winner records."
      );

    if (!confirmed) {
      return;
    }

    setPublishing(true);
    setError("");
    setPublishMessage("");

    try {
      const response = await fetch(
        "/api/admin/publish-draw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winningNumbers:
              simulation.winningNumbers,
            prizePool: Number(prizePool),
          }),
        }
      );

      const data =
        await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to publish the draw."
        );
      }

      setPublishMessage(
        `Draw #${data.draw.id} published successfully.`
      );

      setSimulation(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish draw."
      );
    } finally {
      setPublishing(false);
    }
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
            <span className="text-emerald-400">
              .
            </span>
            HEROES
          </Link>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
              DRAW MANAGEMENT
            </span>

            <Link
              href="/admin"
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Control center
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Draw Management
          </h1>

          <p className="mt-4 max-w-2xl text-white/55">
            Configure the monthly draw, simulate
            results against active subscribers and
            publish the final result.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Success */}
        {publishMessage && (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {publishMessage}
          </div>
        )}

        {/* Draw Controls */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-400">
                Monthly draw
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Simulation controls
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Run a normal random simulation or use
                the controlled test winner mode for
                testing the winner verification workflow.
              </p>

              <p className="mt-4 text-xs leading-5 text-yellow-300/70">
                Test Winner creates a controlled
                5-number match using a valid subscriber
                entry. It does not publish anything until
                you press Publish Draw.
              </p>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              {/* Prize Pool */}
              <div>
                <label
                  htmlFor="prizePool"
                  className="mb-2 block text-xs text-white/45"
                >
                  Simulation prize pool
                </label>

                <input
                  id="prizePool"
                  type="number"
                  min="1"
                  value={prizePool}
                  onChange={(event) =>
                    setPrizePool(
                      event.target.value
                    )
                  }
                  className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm outline-none transition focus:border-emerald-400/50 sm:w-48"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={runSimulation}
                  disabled={
                    simulating || publishing
                  }
                  className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-[#07111f] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {simulating
                    ? "Simulating..."
                    : "Run Simulation"}
                </button>

                <button
                  type="button"
                  onClick={runTestWinner}
                  disabled={
                    simulating || publishing
                  }
                  className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-6 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {simulating
                    ? "Preparing..."
                    : "Test Winner"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Prize Distribution */}
        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.15em] text-white/40">
              5-number match
            </p>

            <p className="mt-3 text-3xl font-bold">
              40%
            </p>

            <p className="mt-2 text-sm text-white/45">
              Jackpot / rollover
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.15em] text-white/40">
              4-number match
            </p>

            <p className="mt-3 text-3xl font-bold">
              35%
            </p>

            <p className="mt-2 text-sm text-white/45">
              Distributed among winners
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.15em] text-white/40">
              3-number match
            </p>

            <p className="mt-3 text-3xl font-bold">
              25%
            </p>

            <p className="mt-2 text-sm text-white/45">
              Distributed among winners
            </p>
          </div>
        </section>

        {/* Simulation Result */}
        {simulation && (
          <section className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.05] p-7">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-400">
                Simulation result
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Winning numbers
              </h2>
            </div>

            {/* Winning Numbers */}
            <div className="mt-6 flex flex-wrap gap-3">
              {simulation.winningNumbers.map(
                (number) => (
                  <div
                    key={number}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-lg font-bold text-emerald-300"
                  >
                    {number}
                  </div>
                )
              )}
            </div>

            {/* Summary */}
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.15em] text-white/40">
                  Participants checked
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {simulation.participantCount}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.15em] text-white/40">
                  Prize pool
                </p>

                <p className="mt-2 text-3xl font-bold">
                  ₹
                  {Number(
                    prizePool
                  ).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Match Results */}
            <div className="mt-8 space-y-4">
              <MatchResult
                title="5-number match"
                percentage="40%"
                result={
                  simulation.prizes
                    .fiveMatch
                }
              />

              <MatchResult
                title="4-number match"
                percentage="35%"
                result={
                  simulation.prizes
                    .fourMatch
                }
              />

              <MatchResult
                title="3-number match"
                percentage="25%"
                result={
                  simulation.prizes
                    .threeMatch
                }
              />
            </div>

            {/* Publish */}
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  Ready to publish?
                </p>

                <p className="mt-1 text-sm text-white/45">
                  Publishing permanently creates the
                  draw and any winner records.
                </p>
              </div>

              <button
                type="button"
                onClick={publishDraw}
                disabled={
                  publishing || simulating
                }
                className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-[#07111f] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing
                  ? "Publishing..."
                  : "Publish Draw"}
              </button>
            </div>
          </section>
        )}

        {/* Navigation shortcuts */}
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <Link
            href="/admin"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25 hover:bg-white/[0.05]"
          >
            <p className="text-sm uppercase tracking-[0.15em] text-white/40">
              Admin
            </p>

            <h3 className="mt-2 text-xl font-semibold">
              Dashboard
            </h3>

            <p className="mt-2 text-sm text-white/45">
              Return to the admin control center.
            </p>
          </Link>

          <Link
            href="/admin/winners"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25 hover:bg-white/[0.05]"
          >
            <p className="text-sm uppercase tracking-[0.15em] text-white/40">
              Winners
            </p>

            <h3 className="mt-2 text-xl font-semibold">
              Winner Management
            </h3>

            <p className="mt-2 text-sm text-white/45">
              Review proof, verify winners and manage
              payouts.
            </p>
          </Link>

          <Link
            href="/draws"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25 hover:bg-white/[0.05]"
          >
            <p className="text-sm uppercase tracking-[0.15em] text-white/40">
              User view
            </p>

            <h3 className="mt-2 text-xl font-semibold">
              Published Draws
            </h3>

            <p className="mt-2 text-sm text-white/45">
              View draws from the subscriber side.
            </p>
          </Link>
        </section>

        <footer className="py-12 text-center text-sm text-white/30">
          Digital Heroes Admin Panel
        </footer>
      </div>
    </main>
  );
}

function MatchResult({
  title,
  percentage,
  result,
}: {
  title: string;
  percentage: string;
  result: {
    pool: number;
    winnerCount: number;
    prizePerWinner: number;
    rollover: boolean;
  };
}) {
  return (
    <div className="rounded-2xl border border-white/10 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">
            {title}
          </p>

          <p className="mt-1 text-xs text-white/40">
            Pool share: {percentage}
          </p>
        </div>

        <div className="text-left md:text-right">
          <p className="text-lg font-bold">
            ₹
            {result.pool.toLocaleString(
              "en-IN"
            )}
          </p>

          {result.rollover ? (
            <p className="text-xs text-yellow-300">
              No winner — jackpot rollover
            </p>
          ) : (
            <p className="text-xs text-emerald-300">
              {result.winnerCount} winner
              {result.winnerCount !== 1
                ? "s"
                : ""}{" "}
              · ₹
              {result.prizePerWinner.toLocaleString(
                "en-IN"
              )}{" "}
              each
            </p>
          )}
        </div>
      </div>
    </div>
  );
}