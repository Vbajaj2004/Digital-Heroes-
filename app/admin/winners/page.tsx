"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getWinners,
  updateWinner,
} from "./actions";

type Winner = {
  id: number;
  draw_id: number;
  user_id: string;
  match_type: string | number;
  prize_amount: number;
  proof_url: string | null;
  verification_status: string;
  payment_status: string;
};

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  async function loadWinners() {
    setLoading(true);
    setError("");

    try {
      const data = await getWinners();

      setWinners(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load winners."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWinners();
  }, []);

  async function performAction(
    winnerId: number,
    action: "approve" | "reject" | "paid"
  ) {
    setActionLoading(winnerId);
    setError("");
    setSuccess("");

    try {
      const result = await updateWinner(
        winnerId,
        action
      );

      setSuccess(
        result.message ||
          "Winner updated successfully."
      );

      await loadWinners();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete action."
      );
    } finally {
      setActionLoading(null);
    }
  }

  function formatStatus(
    status: string | number
  ) {
    return String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function getVerificationClass(
    status: string
  ) {
    if (status === "approved") {
      return "bg-emerald-400/10 text-emerald-300";
    }

    if (status === "rejected") {
      return "bg-red-400/10 text-red-300";
    }

    return "bg-yellow-400/10 text-yellow-300";
  }

  function getPaymentClass(
    status: string
  ) {
    if (status === "paid") {
      return "bg-emerald-400/10 text-emerald-300";
    }

    return "bg-yellow-400/10 text-yellow-300";
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
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

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
              WINNER MANAGEMENT
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
            Verification center
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Winner Management
          </h1>

          <p className="mt-4 max-w-2xl text-white/55">
            Review winner proof, approve or reject claims,
            and mark verified prizes as paid.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-white/50">
              Loading winners...
            </p>
          </div>
        ) : winners.length === 0 ? (
          /* Empty State */
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-2xl text-emerald-300">
              ✓
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              No winners yet
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/45">
              Winners will appear here after an admin
              publishes a draw that contains 3-number,
              4-number, or 5-number matches.
            </p>

            <div className="mt-7">
              <Link
                href="/admin"
                className="inline-flex rounded-full bg-emerald-400 px-6 py-3 font-semibold text-[#07111f] transition hover:bg-emerald-300"
              >
                Back to Draw Management
              </Link>
            </div>
          </div>
        ) : (
          /* Winners */
          <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40">
                  Total winners
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {winners.length}
                </p>
              </div>

              <button
                type="button"
                onClick={loadWinners}
                disabled={
                  loading ||
                  actionLoading !== null
                }
                className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40">
                    <th className="px-4 py-4">
                      Winner
                    </th>

                    <th className="px-4 py-4">
                      Draw
                    </th>

                    <th className="px-4 py-4">
                      Match
                    </th>

                    <th className="px-4 py-4">
                      Prize
                    </th>

                    <th className="px-4 py-4">
                      Proof
                    </th>

                    <th className="px-4 py-4">
                      Verification
                    </th>

                    <th className="px-4 py-4">
                      Payment
                    </th>

                    <th className="px-4 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {winners.map((winner) => {
                    const isBusy =
                      actionLoading === winner.id;

                    return (
                      <tr
                        key={winner.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.02]"
                      >
                        {/* Winner */}
                        <td className="px-4 py-5">
                          <div>
                            <p className="font-semibold">
                              Winner #{winner.id}
                            </p>

                            <p className="mt-1 max-w-[180px] truncate text-xs text-white/40">
                              {winner.user_id}
                            </p>
                          </div>
                        </td>

                        {/* Draw */}
                        <td className="px-4 py-5">
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs">
                            #{winner.draw_id}
                          </span>
                        </td>

                        {/* Match */}
                        <td className="px-4 py-5">
                          <span className="font-semibold">
                            {formatStatus(
                              winner.match_type
                            )}
                          </span>
                        </td>

                        {/* Prize */}
                        <td className="px-4 py-5 font-semibold">
                          ₹
                          {Number(
                            winner.prize_amount
                          ).toLocaleString("en-IN")}
                        </td>

                        {/* Proof */}
                        <td className="px-4 py-5">
                          {winner.proof_url ? (
                            <a
                              href={winner.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
                            >
                              View proof
                            </a>
                          ) : (
                            <span className="text-xs text-white/35">
                              Not uploaded
                            </span>
                          )}
                        </td>

                        {/* Verification */}
                        <td className="px-4 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${getVerificationClass(
                              winner.verification_status
                            )}`}
                          >
                            {formatStatus(
                              winner.verification_status
                            )}
                          </span>
                        </td>

                        {/* Payment */}
                        <td className="px-4 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${getPaymentClass(
                              winner.payment_status
                            )}`}
                          >
                            {formatStatus(
                              winner.payment_status
                            )}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-5">
                          <div className="flex flex-wrap gap-2">
                            {winner.verification_status !==
                              "approved" && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  performAction(
                                    winner.id,
                                    "approve"
                                  )
                                }
                                className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-[#07111f] transition hover:bg-emerald-300 disabled:opacity-50"
                              >
                                {isBusy
                                  ? "..."
                                  : "Approve"}
                              </button>
                            )}

                            {winner.verification_status !==
                              "rejected" && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  performAction(
                                    winner.id,
                                    "reject"
                                  )
                                }
                                className="rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
                              >
                                {isBusy
                                  ? "..."
                                  : "Reject"}
                              </button>
                            )}

                            {winner.verification_status ===
                              "approved" &&
                              winner.payment_status !==
                                "paid" && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    performAction(
                                      winner.id,
                                      "paid"
                                    )
                                  }
                                  className="rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-400/20 disabled:opacity-50"
                                >
                                  {isBusy
                                    ? "..."
                                    : "Mark Paid"}
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}