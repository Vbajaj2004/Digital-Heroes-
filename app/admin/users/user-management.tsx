"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminUsers,
  type AdminUser,
} from "./actions";

function formatDate(
  dateString: string | null
) {
  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatStatus(
  status: string | null
) {
  if (!status) {
    return "No subscription";
  }

  return status
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatPlan(
  plan: string | null
) {
  if (!plan) {
    return "None";
  }

  return (
    plan.charAt(0).toUpperCase() +
    plan.slice(1)
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const data =
        await getAdminUsers();

      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter((user) => {
      const name =
        user.full_name ?? "";

      const id =
        user.id ?? "";

      const role =
        user.role ?? "";

      const plan =
        user.plan ?? "";

      const subscriptionStatus =
        user.subscription_status ?? "";

      return (
        name
          .toLowerCase()
          .includes(term) ||
        id
          .toLowerCase()
          .includes(term) ||
        role
          .toLowerCase()
          .includes(term) ||
        plan
          .toLowerCase()
          .includes(term) ||
        subscriptionStatus
          .toLowerCase()
          .includes(term)
      );
    });
  }, [search, users]);

  const activeSubscribers =
    users.filter(
      (user) =>
        user.subscription_status ===
        "active"
    ).length;

  const adminCount =
    users.filter(
      (user) =>
        user.role === "admin"
    ).length;

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

          <div className="flex items-center gap-3">

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
              USER MANAGEMENT
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

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-12">

        {/* HEADER */}

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Admin control
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            User Management
          </h1>

          <p className="mt-4 max-w-2xl text-white/55">
            Review registered users, subscription
            status and draw participation.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ===================================================
            SUMMARY CARDS
        ==================================================== */}

        <section className="mt-10 grid gap-5 md:grid-cols-3">

          {/* TOTAL USERS */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm text-white/45">
              Total users
            </p>

            <p className="mt-3 text-3xl font-bold">
              {users.length}
            </p>

          </div>

          {/* ACTIVE SUBSCRIBERS */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm text-white/45">
              Active subscribers
            </p>

            <p className="mt-3 text-3xl font-bold">
              {activeSubscribers}
            </p>

          </div>

          {/* ADMINS */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-sm text-white/45">
              Admin accounts
            </p>

            <p className="mt-3 text-3xl font-bold">
              {adminCount}
            </p>

          </div>

        </section>

        {/* ===================================================
            USER TABLE
        ==================================================== */}

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

          {/* TABLE HEADER */}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-2xl font-bold">
                Registered users
              </h2>

              <p className="mt-2 text-sm text-white/45">
                Live data from Supabase.
              </p>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              {/* SEARCH */}

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search users..."
                className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm outline-none transition focus:border-emerald-400/50 sm:w-72"
              />

              {/* REFRESH */}

              <button
                type="button"
                onClick={loadUsers}
                disabled={loading}
                className="rounded-full border border-white/10 px-5 py-3 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Refresh"}
              </button>

            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {loading ? (

            <div className="py-14 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />

              <p className="mt-4 text-sm text-white/45">
                Loading users...
              </p>

            </div>

          ) : filteredUsers.length ===
            0 ? (

            /* ===============================================
               EMPTY SEARCH
            ================================================ */

            <div className="py-14 text-center">

              <p className="text-white/50">
                No matching users found.
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="mt-4 rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
                >
                  Clear search
                </button>
              )}

            </div>

          ) : (

            /* ===============================================
               USERS TABLE
            ================================================ */

            <div className="mt-8 overflow-x-auto">

              <table className="w-full min-w-[1050px] text-left text-sm">

                <thead>

                  <tr className="border-b border-white/10 text-white/40">

                    <th className="px-4 py-4">
                      User
                    </th>

                    <th className="px-4 py-4">
                      Role
                    </th>

                    <th className="px-4 py-4">
                      Subscription
                    </th>

                    <th className="px-4 py-4">
                      Renewal
                    </th>

                    <th className="px-4 py-4">
                      Draws Entered
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={user.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.02]"
                      >

                        {/* USER */}

                        <td className="px-4 py-5">

                          <p className="font-semibold">
                            {user.full_name ||
                              "Unnamed user"}
                          </p>

                          <p className="mt-1 max-w-[280px] truncate text-xs text-white/35">
                            {user.id}
                          </p>

                        </td>

                        {/* ROLE */}

                        <td className="px-4 py-5">

                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              user.role ===
                              "admin"
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-white/5 text-white/60"
                            }`}
                          >
                            {formatStatus(
                              user.role
                            )}
                          </span>

                        </td>

                        {/* SUBSCRIPTION */}

                        <td className="px-4 py-5">

                          <p className="font-semibold">
                            {formatPlan(
                              user.plan
                            )}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            {formatStatus(
                              user.subscription_status
                            )}
                          </p>

                        </td>

                        {/* RENEWAL */}

                        <td className="px-4 py-5">
                          {formatDate(
                            user.renewal_date
                          )}
                        </td>

                        {/* DRAWS */}

                        <td className="px-4 py-5">

                          <span className="inline-flex min-w-8 justify-center rounded-full bg-white/5 px-3 py-1">
                            {user.draws_entered}
                          </span>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* FOOTER */}

        <footer className="py-12 text-center text-sm text-white/30">
          Digital Heroes Admin Panel
        </footer>

      </div>
    </main>
  );
}