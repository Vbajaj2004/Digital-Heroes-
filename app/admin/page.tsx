"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getAdminStats,
} from "./actions";

import type {
  AdminStats,
} from "./actions";

function formatCurrency(
  value: number
) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default function AdminPage() {
  const [stats, setStats] =
    useState<AdminStats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadStats() {
    setLoading(true);
    setError("");

    try {
      const data =
        await getAdminStats();

      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load admin statistics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

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
              ADMIN PANEL
            </span>

            <Link
              href="/protected"
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
            >
              User Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Control center
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Admin Dashboard
          </h1>

          <p className="mt-4 max-w-2xl text-white/55">
            Manage subscribers, draws, charities,
            winners and platform activity from one
            place.
          </p>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Main Statistics */}
        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={
              loading
                ? "..."
                : String(
                    stats?.totalUsers ?? 0
                  )
            }
            description="Registered accounts"
          />

          <StatCard
            title="Active Subscribers"
            value={
              loading
                ? "..."
                : String(
                    stats?.activeSubscribers ??
                      0
                  )
            }
            description="Active memberships"
          />

          <StatCard
            title="Total Prize Pool"
            value={
              loading
                ? "..."
                : formatCurrency(
                    stats?.totalPrizePool ??
                      0
                  )
            }
            description="Across published draws"
          />

          <StatCard
            title="Charity Contributions"
            value={
              loading
                ? "..."
                : formatCurrency(
                    stats?.charityContributions ??
                      0
                  )
            }
            description="Based on active plans"
          />
        </section>

        {/* Control Surfaces */}
        <section className="mt-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-400">
              Administration
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Control surfaces
            </h2>

            <p className="mt-2 text-sm text-white/45">
              Open each operational area directly.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <ControlCard
              title="User Management"
              description="View users, subscriptions and draw participation."
              href="/admin/users"
            />

            <ControlCard
              title="Draw Management"
              description="Configure, simulate and publish monthly draws."
              href="/admin/draws"
            />

            <ControlCard
              title="Charity Management"
              description="Add, edit and manage charity listings."
              href="/admin/charities"
            />

            <ControlCard
              title="Winner Management"
              description="Review proof and manage payout status."
              href="/admin/winners"
            />
          </div>
        </section>

        {/* Reports & Analytics */}
        <section className="mt-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-400">
              Reports
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Reports & Analytics
            </h2>

            <p className="mt-2 text-sm text-white/45">
              Live operational statistics from the
              Digital Heroes database.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <ReportCard
              title="Published Draws"
              value={
                loading
                  ? "..."
                  : String(
                      stats?.publishedDraws ??
                        0
                    )
              }
            />

            <ReportCard
              title="Draw Entries"
              value={
                loading
                  ? "..."
                  : String(
                      stats?.totalDrawEntries ??
                        0
                    )
              }
            />

            <ReportCard
              title="Total Winners"
              value={
                loading
                  ? "..."
                  : String(
                      stats?.totalWinners ??
                        0
                    )
              }
            />

            <ReportCard
              title="Paid Winnings"
              value={
                loading
                  ? "..."
                  : formatCurrency(
                      stats?.paidWinnings ??
                        0
                  )
              }
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {/* Latest Draw */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-white/35">
                    Draw statistics
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    Latest Draw
                  </h3>
                </div>

                <Link
                  href="/admin/draws"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
                >
                  Manage
                </Link>
              </div>

              {loading ? (
                <p className="mt-7 text-white/45">
                  Loading...
                </p>
              ) : stats?.latestDraw ? (
                <div className="mt-7 space-y-4">
                  <InfoRow
                    label="Draw ID"
                    value={`#${stats.latestDraw.id}`}
                  />

                  <InfoRow
                    label="Date"
                    value={formatDate(
                      stats.latestDraw.draw_date
                    )}
                  />

                  <InfoRow
                    label="Prize pool"
                    value={formatCurrency(
                      stats.latestDraw
                        .prize_pool
                    )}
                  />

                  <InfoRow
                    label="Status"
                    value={
                      stats.latestDraw
                        .status ?? "—"
                    }
                  />
                </div>
              ) : (
                <p className="mt-7 text-white/45">
                  No draws found.
                </p>
              )}
            </div>

            {/* Winner Distribution */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-white/35">
                    Winner statistics
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    Match Distribution
                  </h3>
                </div>

                <Link
                  href="/admin/winners"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
                >
                  Winners
                </Link>
              </div>

              <div className="mt-7 space-y-4">
                <InfoRow
                  label="5-number matches"
                  value={
                    loading
                      ? "..."
                      : String(
                          stats?.fiveMatchWinners ??
                            0
                        )
                  }
                />

                <InfoRow
                  label="4-number matches"
                  value={
                    loading
                      ? "..."
                      : String(
                          stats?.fourMatchWinners ??
                            0
                        )
                  }
                />

                <InfoRow
                  label="3-number matches"
                  value={
                    loading
                      ? "..."
                      : String(
                          stats?.threeMatchWinners ??
                            0
                        )
                  }
                />

                <InfoRow
                  label="Approved winnings"
                  value={
                    loading
                      ? "..."
                      : formatCurrency(
                          stats?.approvedWinnings ??
                            0
                        )
                  }
                />
              </div>
            </div>
          </div>

          {/* Platform Overview */}
          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-white/35">
                Platform overview
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Current platform activity
              </h3>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MiniStat
                label="Current prize pool"
                value={
                  loading
                    ? "..."
                    : formatCurrency(
                        stats?.currentPrizePool ??
                          0
                      )
                }
              />

              <MiniStat
                label="Active charities"
                value={
                  loading
                    ? "..."
                    : String(
                        stats?.activeCharities ??
                          0
                      )
                }
              />

              <MiniStat
                label="Featured charities"
                value={
                  loading
                    ? "..."
                    : String(
                        stats?.featuredCharities ??
                          0
                      )
                }
              />

              <MiniStat
                label="Total draws"
                value={
                  loading
                    ? "..."
                    : String(
                        stats?.totalDraws ??
                          0
                      )
                }
              />
            </div>

            <p className="mt-6 text-xs leading-5 text-white/30">
              Charity contribution totals are
              calculated from the current project plan
              prices and each active subscriber's selected
              contribution percentage.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center text-sm text-white/30">
          Digital Heroes Admin Panel
        </footer>
      </div>
    </main>
  );
}

/* -----------------------------------------------------------
   Components
----------------------------------------------------------- */

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-white/45">
        {title}
      </p>

      <p className="mt-4 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-white/40">
        {description}
      </p>
    </div>
  );
}

function ControlCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold">
          {title}
        </h3>

        <span className="text-xl text-emerald-400 transition group-hover:translate-x-1">
          →
        </span>
      </div>

      <p className="mt-3 max-w-lg text-sm leading-6 text-white/50">
        {description}
      </p>

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300/70">
        Open section
      </p>
    </Link>
  );
}

function ReportCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-white/45">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.03] px-5 py-4">
      <span className="text-sm text-white/45">
        {label}
      </span>

      <span className="text-sm font-semibold capitalize text-white/80">
        {value}
      </span>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-xs uppercase tracking-[0.15em] text-white/35">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}