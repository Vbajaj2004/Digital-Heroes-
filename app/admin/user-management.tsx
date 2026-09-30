"use client";

import { useState } from "react";

type User = {
  id: string;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
};

type Subscription = {
  user_id: string;
  plan: string | null;
  status: string | null;
  renewal_date: string | null;
};

type UserManagementProps = {
  users: User[];
  subscriptions: Subscription[];
};

export default function UserManagement({
  users,
  subscriptions,
}: UserManagementProps) {
  const [userList, setUserList] =
    useState<User[]>(users);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [fullName, setFullName] =
    useState("");

  const [role, setRole] =
    useState<"admin" | "subscriber">(
      "subscriber"
    );

  const [saving, setSaving] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // =========================================================
  // FIND SUBSCRIPTION
  // =========================================================

  function getSubscription(
    userId: string
  ) {
    return subscriptions.find(
      (subscription) =>
        subscription.user_id === userId
    );
  }

  // =========================================================
  // START EDITING
  // =========================================================

  function startEditing(user: User) {
    setEditingUser(user);

    setFullName(
      user.full_name || ""
    );

    setRole(
      user.role === "admin"
        ? "admin"
        : "subscriber"
    );

    setSuccessMessage("");
    setErrorMessage("");
  }

  // =========================================================
  // CLOSE EDITOR
  // =========================================================

  function closeEditor() {
    if (saving) {
      return;
    }

    setEditingUser(null);
    setFullName("");
    setRole("subscriber");

    setSuccessMessage("");
    setErrorMessage("");
  }

  // =========================================================
  // SAVE
  // =========================================================

  async function handleSave() {
    if (!editingUser) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    const cleanedName =
      fullName.trim();

    if (!cleanedName) {
      setErrorMessage(
        "Full name cannot be empty."
      );

      return;
    }

    if (cleanedName.length > 100) {
      setErrorMessage(
        "Full name must be 100 characters or less."
      );

      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/users",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId: editingUser.id,
            fullName: cleanedName,
            role,
          }),
        }
      );

      // -----------------------------------------------------
      // SAFELY READ RESPONSE
      // -----------------------------------------------------

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data: {
        error?: string;
        user?: User;
      } = {};

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text =
          await response.text();

        console.error(
          "Non-JSON API response:",
          text
        );

        throw new Error(
          `Server returned an unexpected response (${response.status}).`
        );
      }

      // -----------------------------------------------------
      // API ERROR
      // -----------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update user."
        );
      }

      if (!data.user) {
        throw new Error(
          "Updated user was not returned by the server."
        );
      }

      // -----------------------------------------------------
      // UPDATE TABLE
      // -----------------------------------------------------

      setUserList(
        (currentUsers) =>
          currentUsers.map((user) =>
            user.id === editingUser.id
              ? {
                  ...user,
                  full_name:
                    data.user?.full_name ??
                    user.full_name,
                  role:
                    data.user?.role ??
                    user.role,
                }
              : user
          )
      );

      // -----------------------------------------------------
      // UPDATE EDITOR
      // -----------------------------------------------------

      setEditingUser({
        ...editingUser,
        full_name:
          data.user.full_name,
        role:
          data.user.role,
      });

      setFullName(
        data.user.full_name || ""
      );

      setRole(
        data.user.role === "admin"
          ? "admin"
          : "subscriber"
      );

      setSuccessMessage(
        "User updated successfully."
      );
    } catch (error) {
      console.error(
        "Admin user update error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update user."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="users"
      className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
            User management
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Platform users
          </h2>

          <p className="mt-2 text-sm text-white/45">
            View and edit registered user profiles
            and subscription information.
          </p>

        </div>

        <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/50">
          {userList.length} users
        </div>

      </div>

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {successMessage && (
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
          {successMessage}
        </div>
      )}

      {/* =====================================================
          ERROR
      ====================================================== */}

      {errorMessage && (
        <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="mt-6 overflow-x-auto">

        <table className="w-full min-w-[900px] text-left">

          <thead>

            <tr className="border-b border-white/10 text-sm text-white/40">

              <th className="pb-4 pr-5">
                User
              </th>

              <th className="pb-4 pr-5">
                Role
              </th>

              <th className="pb-4 pr-5">
                Subscription
              </th>

              <th className="pb-4 pr-5">
                Renewal
              </th>

              <th className="pb-4 pr-5">
                Joined
              </th>

              <th className="pb-4 text-right">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {userList.length > 0 ? (
              userList.map((user) => {

                const subscription =
                  getSubscription(
                    user.id
                  );

                return (
                  <tr
                    key={user.id}
                    className="border-b border-white/5"
                  >

                    {/* USER */}

                    <td className="py-5 pr-5">

                      <p className="font-semibold">
                        {user.full_name ||
                          "Unnamed user"}
                      </p>

                      <p className="mt-1 max-w-[280px] truncate text-xs text-white/30">
                        {user.id}
                      </p>

                    </td>

                    {/* ROLE */}

                    <td className="py-5 pr-5">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.role ===
                          "admin"
                            ? "bg-purple-400/10 text-purple-300"
                            : "bg-emerald-400/10 text-emerald-300"
                        }`}
                      >
                        {user.role ===
                        "admin"
                          ? "Administrator"
                          : "Subscriber"}
                      </span>

                    </td>

                    {/* SUBSCRIPTION */}

                    <td className="py-5 pr-5">

                      {subscription ? (
                        <div>

                          <p className="font-semibold">
                            {subscription.plan
                              ? subscription.plan
                                  .charAt(0)
                                  .toUpperCase() +
                                subscription.plan.slice(
                                  1
                                )
                              : "Unknown"}
                          </p>

                          <p
                            className={`mt-1 text-xs ${
                              subscription.status ===
                              "active"
                                ? "text-emerald-300"
                                : "text-white/40"
                            }`}
                          >
                            {subscription.status ||
                              "inactive"}
                          </p>

                        </div>
                      ) : (
                        <span className="text-sm text-white/35">
                          No subscription
                        </span>
                      )}

                    </td>

                    {/* RENEWAL */}

                    <td className="py-5 pr-5 text-sm text-white/50">

                      {subscription?.renewal_date
                        ? new Date(
                            subscription.renewal_date
                          ).toLocaleDateString(
                            "en-IN"
                          )
                        : "—"}

                    </td>

                    {/* JOINED */}

                    <td className="py-5 pr-5 text-sm text-white/50">

                      {user.created_at
                        ? new Date(
                            user.created_at
                          ).toLocaleDateString(
                            "en-IN"
                          )
                        : "—"}

                    </td>

                    {/* ACTION */}

                    <td className="py-5 text-right">

                      <button
                        type="button"
                        onClick={() =>
                          startEditing(user)
                        }
                        className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
                      >
                        Edit
                      </button>

                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>

                <td
                  colSpan={6}
                  className="py-10 text-center text-white/40"
                >
                  No users found.
                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

      {/* =====================================================
          EDIT PANEL
      ====================================================== */}

      {editingUser && (
        <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.05] p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
                Edit profile
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                {editingUser.full_name ||
                  "Unnamed user"}
              </h3>

              <p className="mt-1 text-xs text-white/35">
                User ID: {editingUser.id}
              </p>

            </div>

            <button
              type="button"
              onClick={closeEditor}
              disabled={saving}
              className="rounded-full border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close
            </button>

          </div>

          {/* FORM */}

          <div className="mt-8 grid gap-5 md:grid-cols-2">

            {/* FULL NAME */}

            <div>

              <label
                htmlFor="admin-full-name"
                className="mb-2 block text-sm text-white/50"
              >
                Full name
              </label>

              <input
                id="admin-full-name"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 disabled:opacity-50"
                placeholder="Enter full name"
              />

            </div>

            {/* ROLE */}

            <div>

              <label
                htmlFor="admin-user-role"
                className="mb-2 block text-sm text-white/50"
              >
                Role
              </label>

              <select
                id="admin-user-role"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value ===
                      "admin"
                      ? "admin"
                      : "subscriber"
                  )
                }
                disabled={saving}
                className="w-full rounded-2xl border border-white/10 bg-[#101b2c] px-4 py-3 text-white outline-none transition focus:border-emerald-400/50 disabled:opacity-50"
              >

                <option value="subscriber">
                  Subscriber
                </option>

                <option value="admin">
                  Administrator
                </option>

              </select>

            </div>

          </div>

          {/* SAVE */}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-6 rounded-full bg-emerald-400 px-6 py-3 font-semibold text-[#07111f] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save changes"}
          </button>

        </div>
      )}

    </section>
  );
}